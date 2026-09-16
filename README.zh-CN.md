<div align="center">

# HTML Drop

**自托管的 HTML 静态页面托管服务，上传即得短链。**

上传一个 HTML 文件 → 生成干净可分享的链接 → 内网、公网任何人通过服务器 IP 直接打开。一个固定端口，托管无限页面。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen.svg)](package.json)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](Dockerfile)

[English](README.md)

</div>

---

## 为什么做这个

你的AI生成了一份漂亮的 HTML 报告 / 大屏 / Demo，想分享给同事或其他人。传文件很low很麻烦，内网又未必能上公网托管平台。**HTML Drop** 让你只需在服务器部署本项目，访问站点后把html文件丢进去，就能把html转为 `http://<服务器IP>:8080/p/q3-report` 这样的短链发出去公开访问。

## 功能特性

- **秒出短链** —— 每次上传自动生成唯一 ID（`/p/xxxxxx`），也支持自定义 URI（`/p/q3-report`）
- **URI 可编辑** —— 随时改 URI，旧链接自动 302 跳转到新链接，已分发的链接不会失效
- **多文件上传** —— 支持拖拽 / 多选 `.html` 文件
- **完整管理** —— 后台搜索、改标题、改 URI、复制链接、删除
- **只读目录页** —— 首页给访客浏览所有已发布页面
- **可选鉴权** —— 用 `UPLOAD_TOKEN` 保护管理接口，页面访问始终公开
- **轻量便携** —— 约 50 MB 镜像，`node server.js` 即可运行，无需数据库

## 快速开始

### Docker（推荐）

```bash
docker build -t html-drop .
docker run -d --name html-drop -p 8080:8080 -v html-drop-data:/data html-drop
```

或用 Compose：

```bash
docker compose up -d
```

### 本地开发

```bash
npm install
npm start
```

启动后访问：

| 地址 | 用途 |
|---|---|
| `http://IP:8080/admin` | 管理后台（上传 / 管理） |
| `http://IP:8080/` | 只读页面目录 |
| `http://IP:8080/p/<id>` | 已发布的页面 |

## 使用方式

### 后台界面上传

1. 打开 `http://IP:8080/admin`
2. 拖入 HTML 文件（或点击选择，可多选）
3. 可选填自定义 URI（如 `q3-report`），留空则自动生成短链
4. 分享生成的 `http://IP:8080/p/<id>` 链接

### 命令行上传

```bash
# 自动生成短链
curl -F "files=@report.html" http://IP:8080/api/upload

# 自定义 URI
curl -F "files=@report.html" -F "id=q3-report" http://IP:8080/api/upload
```

## 配置项

通过环境变量设置：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 容器内监听端口 |
| `DATA_DIR` | `/data` | 存储目录（建议挂卷持久化） |
| `MAX_FILE_MB` | `20` | 单文件大小上限（MB） |
| `UPLOAD_TOKEN` | 空 | 设置后上传 / 重命名 / 删除需携带令牌 |

> 无论是否设置 `UPLOAD_TOKEN`，页面访问端点 `/p/<id>` 始终公开。

## API

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| `GET` | `/api/config` | — | 服务配置（needToken, maxFileMB） |
| `GET` | `/api/files` | — | 列出已发布页面 |
| `POST` | `/api/upload` | token | 上传（字段 `files`，可选 `id`） |
| `POST` | `/api/files/:id/rename` | token | 改标题（链接不变） |
| `POST` | `/api/files/:id/uri` | token | 改 URI（旧链接自动跳转） |
| `DELETE` | `/api/files/:id` | token | 删除页面 |
| `GET` | `/p/:id` | — | 查看页面 |

设置 `UPLOAD_TOKEN` 后，受保护接口通过 `x-upload-token` 请求头或 `?token=` 参数传递令牌。

## 项目结构

```
html-drop/
├── server.js            # Express 服务与 API
├── public/
│   ├── admin.html       # 管理后台（上传 / 管理）
│   └── index.html       # 只读目录页
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── LICENSE
└── data/                # 上传文件（已 gitignore，通过卷持久化）
```

## 部署建议

- **持久化**：把 `/data` 挂载到卷，容器重启页面不丢。
- **反向代理**：若通过 Nginx 暴露，可将 `/`、`/p/` 公开，`/admin`、`/api/` 在代理层做限制（或用 `UPLOAD_TOKEN`）。
- **防火墙**：宿主机只开放映射端口。

## 参与贡献

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 更新日志

见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

[MIT](LICENSE) © 2026 lyq
