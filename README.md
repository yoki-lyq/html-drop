<div align="center">

# HTML Drop

**Self-hosted HTML hosting with short links.**

Upload an HTML file → get a clean, shareable URL → anyone on your network opens it via the server IP. One fixed port serves unlimited pages.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen.svg)](package.json)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg)](Dockerfile)

[中文文档](README.zh-CN.md)

</div>

---

## Why

You generate a nice HTML report / dashboard / demo and want to share it with colleagues. Copying files around is painful, and public hosting services aren't always available on an intranet. **HTML Drop** lets you deploy one container, drop files into a web admin page, and hand out a short URL like `http://<server-ip>:8080/p/q3-report`.

## Features

- **Instant short links** — every upload gets a unique ID (`/p/xxxxxx`), or a custom URI of your choice (`/p/q3-report`)
- **Custom & editable URI** — rename the URI anytime; old links 302-redirect to the new one automatically
- **Multi-file upload** — drag & drop or select multiple `.html` files at once
- **Manage everything** — search, rename title, edit URI, copy link, delete from a clean admin UI
- **Read-only directory** — a public index page lets visitors browse all published pages
- **Optional auth** — protect the admin APIs with `UPLOAD_TOKEN`; viewing pages stays public
- **Tiny & portable** — ~50 MB Docker image, single `node server.js` to run, no database

## Quick start

### Docker (recommended)

```bash
docker build -t html-drop .
docker run -d --name html-drop -p 8080:8080 -v html-drop-data:/data html-drop
```

or with Compose:

```bash
docker compose up -d
```

### Local development

```bash
npm install
npm start
```

Then open:

| URL | Purpose |
|---|---|
| `http://IP:8080/admin` | Admin console (upload / manage) |
| `http://IP:8080/` | Read-only directory of published pages |
| `http://IP:8080/p/<id>` | A published page |

## Usage

### Upload from the admin UI

1. Open `http://IP:8080/admin`
2. Drop HTML files (or click to select, multiple allowed)
3. Optionally type a custom URI (e.g. `q3-report`) — leave blank for a random short ID
4. Share the generated `http://IP:8080/p/<id>` link

### Upload from the command line

```bash
# random short ID
curl -F "files=@report.html" http://IP:8080/api/upload

# custom URI
curl -F "files=@report.html" -F "id=q3-report" http://IP:8080/api/upload
```

## Configuration

Set via environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Listening port inside the container |
| `DATA_DIR` | `/data` | Storage directory (persist via volume) |
| `MAX_FILE_MB` | `20` | Max size per file (MB) |
| `UPLOAD_TOKEN` | *(empty)* | When set, upload / rename / delete require this token |

> The page-viewing endpoint `/p/<id>` is always public regardless of `UPLOAD_TOKEN`.

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/config` | — | Service config (needToken, maxFileMB) |
| `GET` | `/api/files` | — | List published pages |
| `POST` | `/api/upload` | token | Upload files (field `files`, optional `id`) |
| `POST` | `/api/files/:id/rename` | token | Rename title (link unchanged) |
| `POST` | `/api/files/:id/uri` | token | Change URI (old link redirects) |
| `DELETE` | `/api/files/:id` | token | Delete a page |
| `GET` | `/p/:id` | — | View a page |

When `UPLOAD_TOKEN` is set, protected routes accept it via the `x-upload-token` header or `?token=` query parameter.

## Project structure

```
html-drop/
├── server.js            # Express server & API
├── public/
│   ├── admin.html       # Admin console (upload / manage)
│   └── index.html       # Read-only directory
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── LICENSE
└── data/                # Uploaded files (gitignored, persisted via volume)
```

## Deployment notes

- **Persist data**: mount `/data` to a volume so pages survive container restarts.
- **Behind a reverse proxy**: if you expose it via Nginx, forward `/` and `/p/` publicly, and protect `/admin` and `/api/` at the proxy layer (or use `UPLOAD_TOKEN`).
- **Firewall**: open only the mapped port on the host.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE) © 2026 lyq
