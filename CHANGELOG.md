# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-16

### Added

- Express-based static HTML hosting service
- Admin console (`/admin`) with drag & drop multi-file upload
- Automatic short-link generation (`/p/<id>`) per uploaded page
- Custom & editable URI with 302 redirect for old links
- Read-only public directory (`/`)
- Title rename, search, copy-link, and delete management
- Optional `UPLOAD_TOKEN` authentication for admin APIs
- Configurable `PORT`, `DATA_DIR`, `MAX_FILE_MB`
- Dockerfile and docker-compose deployment

[1.0.0]: https://github.com/yoki-lyq/html-drop/releases/tag/v1.0.0
