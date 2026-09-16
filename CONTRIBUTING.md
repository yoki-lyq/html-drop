# Contributing to HTML Drop

Thanks for your interest in contributing! Here are a few guidelines to keep things smooth.

## Getting started

```bash
git clone https://github.com/yoki-lyq/html-drop.git
cd html-drop
npm install
npm start   # http://localhost:8080/admin
```

No database or build step is required — the project is plain Node.js + static front-end files.

## Code style

- Use plain JavaScript (Node.js >= 18), no transpilation.
- Prefer `const` / `let`; avoid `var`.
- Keep the server logic in `server.js`; put all browser code in `public/*.html` (no front-end build system).
- Match the existing 2-space indentation and single-quote style.

## Making changes

1. Open an issue first to discuss non-trivial changes.
2. Fork the repo and create a feature branch.
3. Make focused, atomic commits with clear messages.
4. Test manually:
   - upload a single file, multiple files, and a custom URI
   - edit URI and confirm the old link redirects (302)
   - test URI conflicts and invalid URIs are rejected
   - test `UPLOAD_TOKEN` auth on protected endpoints
5. Update the relevant docs (`README.md` / `README.zh-CN.md`) if behavior changes.

## Reporting bugs

Include:

- Node / Docker version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (`docker logs html-drop`)

## Commit message convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `chore:` maintenance

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
