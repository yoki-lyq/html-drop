const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const MAX_SIZE = parseInt(process.env.MAX_FILE_MB || '20', 10) * 1024 * 1024;
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN || '';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let meta = {};
try { meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8')); } catch (e) {}
function saveMeta() {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

// 兼容旧文件：目录里已有的 <名字>.html 直接以文件名作为 id 注册
for (const f of fs.readdirSync(UPLOAD_DIR).filter((f) => /\.html?$/i.test(f))) {
  const id = f.replace(/\.html?$/i, '');
  if (!meta[id]) meta[id] = { title: id };
}
saveMeta();

const app = express();
app.use(express.json());

function genId() {
  let id;
  do {
    id = crypto.randomBytes(4).toString('base64url').slice(0, 6).toLowerCase();
  } while (fs.existsSync(path.join(UPLOAD_DIR, id + '.html')));
  return id;
}

// 自定义 URI 规则：3~64 位小写字母/数字/-/_
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{2,63}$/;

function idTaken(id) {
  return fs.existsSync(path.join(UPLOAD_DIR, id + '.html')) || !!((meta._aliases || {})[id]);
}

// 解析别名链（改 URI 后旧 ID 仍能找到新文件）
function resolveId(id) {
  const aliases = meta._aliases || {};
  let cur = id;
  let hops = 0;
  while (aliases[cur] && hops < 5) {
    cur = aliases[cur];
    hops++;
  }
  return cur;
}

function fileFor(id) {
  if (!id || id.length > 120 || /[\/\\]/.test(id) || id.startsWith('.')) return null;
  const rid = resolveId(id);
  const p = path.join(UPLOAD_DIR, rid + '.html');
  return p.startsWith(UPLOAD_DIR) && fs.existsSync(p) ? { path: p, id: rid } : null;
}

function checkToken(req, res, next) {
  if (!UPLOAD_TOKEN) return next();
  const token = req.headers['x-upload-token'] || req.query.token;
  if (token === UPLOAD_TOKEN) return next();
  return res.status(401).json({ error: '需要有效的管理令牌 (x-upload-token / ?token=)' });
}

function listPages() {
  return fs.readdirSync(UPLOAD_DIR)
    .filter((f) => /\.html?$/i.test(f))
    .map((f) => {
      const id = f.replace(/\.html?$/i, '');
      const st = fs.statSync(path.join(UPLOAD_DIR, f));
      return { id, title: (meta[id] && meta[id].title) || id, size: st.size, mtime: st.mtime, url: `/p/${id}` };
    })
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (/\.html?$/i.test(file.originalname)) return cb(null, true);
    cb(new Error('仅支持 .html / .htm 文件'));
  },
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/config', (req, res) => {
  res.json({ needToken: !!UPLOAD_TOKEN, maxFileMB: MAX_SIZE / 1024 / 1024 });
});

app.get('/api/files', (req, res) => {
  res.json({ files: listPages() });
});

app.post('/api/upload', checkToken, (req, res) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || !req.files.length) return res.status(400).json({ error: '未收到文件 (字段名 files)' });
    // 单文件上传时可用表单字段 id 自定义 URI
    let customId = String((req.body && req.body.id) || '').trim().toLowerCase();
    if (customId) {
      if (req.files.length > 1) return res.status(400).json({ error: '多文件上传时不支持自定义 URI' });
      if (!SLUG_RE.test(customId)) return res.status(400).json({ error: 'URI 需为 3~64 位小写字母/数字/-/_' });
      if (idTaken(customId)) return res.status(409).json({ error: 'URI 已被占用' });
    } else {
      customId = null;
    }
    const uploaded = req.files.map((f) => {
      const id = customId || genId();
      fs.writeFileSync(path.join(UPLOAD_DIR, id + '.html'), f.buffer);
      meta[id] = { title: f.originalname.replace(/\.html?$/i, '') };
      return { id, title: meta[id].title, url: `/p/${id}` };
    });
    saveMeta();
    res.json({ ok: true, files: uploaded });
  });
});

app.post('/api/files/:id/rename', checkToken, (req, res) => {
  const found = fileFor(req.params.id);
  if (!found) return res.status(404).json({ error: '页面不存在' });
  const title = String((req.body && req.body.title) || '').trim().slice(0, 120);
  if (!title) return res.status(400).json({ error: '标题不能为空' });
  meta[found.id] = { title };
  saveMeta();
  res.json({ ok: true, id: found.id, title, url: `/p/${found.id}` });
});

app.post('/api/files/:id/uri', checkToken, (req, res) => {
  const found = fileFor(req.params.id);
  if (!found) return res.status(404).json({ error: '页面不存在' });
  const newId = String((req.body && req.body.newId) || '').trim().toLowerCase();
  if (!SLUG_RE.test(newId)) return res.status(400).json({ error: 'URI 需为 3~64 位小写字母/数字/-/_' });
  if (newId === found.id) return res.json({ ok: true, id: newId, url: `/p/${newId}` });
  if (idTaken(newId)) return res.status(409).json({ error: 'URI 已被占用' });
  fs.renameSync(found.path, path.join(UPLOAD_DIR, newId + '.html'));
  meta[newId] = meta[found.id] || { title: found.id };
  delete meta[found.id];
  meta._aliases = meta._aliases || {};
  meta._aliases[found.id] = newId; // 旧链接自动跳转新链接
  saveMeta();
  res.json({ ok: true, id: newId, url: `/p/${newId}`, oldUrl: `/p/${found.id}` });
});

app.delete('/api/files/:id', checkToken, (req, res) => {
  const found = fileFor(req.params.id);
  if (!found) return res.status(404).json({ error: '页面不存在' });
  fs.unlinkSync(found.path);
  delete meta[found.id];
  if (meta._aliases) {
    for (const [k, v] of Object.entries(meta._aliases)) if (v === found.id) delete meta._aliases[k];
  }
  saveMeta();
  res.json({ ok: true });
});

// 页面展示：/p/<id>（旧 URI 自动 302 到新 URI）
app.get('/p/:id', (req, res) => {
  const found = fileFor(req.params.id);
  if (!found) return res.status(404).send('404 Not Found');
  if (found.id !== req.params.id) return res.redirect(302, `/p/${encodeURIComponent(found.id)}`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline');
  fs.createReadStream(found.path).pipe(res);
});

// 兼容旧链接 /f/<文件名>
app.get('/f/:name', (req, res) => {
  const name = path.basename(String(req.params.name));
  const p = path.join(UPLOAD_DIR, name);
  if (!/\.html?$/i.test(name) || !fs.existsSync(p)) return res.status(404).send('404 Not Found');
  res.redirect('/p/' + name.replace(/\.html?$/i, ''));
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Bad Request' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`html-drop listening on 0.0.0.0:${PORT}, data dir: ${DATA_DIR}`);
  console.log(`  页面目录:  http://<ip>:${PORT}/`);
  console.log(`  管理后台:  http://<ip>:${PORT}/admin`);
  console.log(`  页面访问:  http://<ip>:${PORT}/p/<页面ID>`);
});
