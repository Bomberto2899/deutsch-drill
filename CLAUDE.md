# Deutsch Drill — working rules

- Every change: add/check off the item in `TODO.md` and update `README.md` where relevant, in the same task.
- After frontend changes run `npm run build` (the installed launcher serves `dist/`). Run `npm test` and `npm run typecheck`.
- Launcher/desktop-integration changes must also be logged in `~/Documents/omarchy-cosmic-setup.md` (edit the template, re-render).
- After each finished TODO item: commit and push to `origin main` (no need to ask).
- Keep everything cross-platform (Linux, Windows, macOS): no shell-only tooling in npm scripts, paths via `node:path`, OS specifics in `src/server/paths.ts` and the launcher.
