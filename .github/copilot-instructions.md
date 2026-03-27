## Project: Rekordbox XML Viewer

- Vanilla JS (ES modules), no framework
- Vite for dev server and build; source lives in `src/`
- Tests via Vitest (`npm test`); always run tests after changes
- Linting + formatting via Biome (`npm run lint`); always run lint after changes
- Do not add npm dependencies without asking first
- Pin exact versions (`save-exact=true` in `.npmrc`)
- Lockfile (`package-lock.json`) contains SHA-512 integrity hashes — always commit it
- Use `npm ci` (not `npm install`) in CI to enforce lockfile integrity
- Target browsers: last 2 versions of Chrome, Firefox, Safari
- Keep it simple — prefer fewer abstractions over more
