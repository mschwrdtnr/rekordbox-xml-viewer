# Improvement Opportunities — Rekordbox XML Viewer

A comprehensive analysis of the current codebase with actionable suggestions across multiple categories. Each item is tagged with an estimated effort: **[S]** small, **[M]** medium, **[L]** large.

---

## 1. Testing

The project currently has zero tests. All the core logic lives in pure (side-effect-free) functions that are trivially testable.

### 1.1 Unit Tests — `[S]`
Functions that could be covered immediately with no mocking:

| Function | What to test |
|---|---|
| `parseTracks` | Correct field extraction, empty/missing attributes fallback to `''` |
| `parsePlaylists` | Folder + playlist tree structure, missing `PLAYLISTS` node |
| `mapPlaylistNode` | Type `'0'` → folder, otherwise → playlist |
| `countPlaylists` | Nested folder counting, empty tree |
| `formatDuration` | Normal values, `NaN`/`null` input, zero |
| `durationToSeconds` | Normal, empty string, `undefined` |
| `decodeLocation` | URL-encoded paths, `file://localhost/` prefix stripping, empty string |

**Recommended tool:** [Vitest](https://vitest.dev/) — zero-config, fast, works without a bundler via `vitest --environment jsdom`.

### 1.2 Integration / DOM Tests — `[M]`
- Simulate a file-change event with a fixture XML string and assert the rendered DOM (track count, playlist names, table rows).
- Test that parse errors render the error status correctly.
- Vitest + `@testing-library/dom` is a lightweight option.

### 1.3 End-to-End Tests — `[L]`
[Playwright](https://playwright.dev/) could drive a real browser, upload a fixture file, click playlists, sort columns, and search — catching regressions the unit tests miss.

---

## 2. Bugs

### 2.1 Windows Path Decoding — `[S]`
`decodeLocation` replaces `file://localhost/` with `/`, turning `file://localhost/C:/Music/track.mp3` into `/C:/Music/track.mp3` (note the leading `/`). On Windows this is incorrect.

```js
// Current (broken on Windows)
const withoutPrefix = location.replace('file://localhost/', '/');

// Fix
const withoutPrefix = location.startsWith('file://localhost/')
  ? location.slice('file://localhost/'.length)   // → "C:/Music/track.mp3" ✓
  : location.replace(/^file:\/\//, '');
```

### 2.2 `trackMap` Recreated on Every Render — `[S]`
`renderPlaylistDetail` builds `new Map(allTracks.map(...))` on every sort click and keystroke. It should be computed once after `parseTracks` and reused.

### 2.3 Column Definition / Render Out-of-Sync — `[S]`
`DETAIL_COLUMNS` declares the column order declaratively, but the `tbody` row building uses a hard-coded positional array literal. Adding or reordering a column in one place silently breaks the other. The row should be built by iterating `DETAIL_COLUMNS` and looking up the value by `key`.

---

## 3. Code Quality & Architecture

### 3.1 ES Modules — `[M]`
All code sits in a single 340-line `script.js` in global scope. Splitting into ES modules improves maintainability and enables tree-shaking if a bundler is added later:

```
src/
  main.js          – event wiring, UI state
  parser.js        – parseTracks, parsePlaylists, mapPlaylistNode
  render.js        – renderPlaylists, renderPlaylistDetail
  utils.js         – formatDuration, durationToSeconds, decodeLocation
```

Modules also make unit testing easier since each file can be imported independently.

### 3.2 TypeScript — `[M]`
The codebase is naturally typed (track objects have a fixed shape, the playlist tree is a recursive union type). Adding TypeScript (even with `checkJs` + JSDoc first) would:
- Catch the `duration` sort path (currently sorts as a string vs seconds inconsistently)
- Catch `getAttribute` returning `null` passed as a number
- Self-document function contracts

### 3.3 Linting & Formatting — `[S]`
Add ESLint + Prettier (or Biome for both in one tool). A `package.json` with `scripts.lint` and `scripts.format` hardens code style consistency.

### 3.4 `renderPlaylistDetail` Decomposition — `[S]`
The function is ~100 lines and does header building, search wiring, filtering, sorting, and table construction in one go. Splitting it into `buildDetailHeader()`, `filterTracks()`, `sortTracks()`, and `buildTrackTable()` makes each piece independently testable.

---

## 4. Accessibility

This area currently has the most gaps.

### 4.1 Keyboard Navigation for Tree — `[M]`
Playlist folders and leaves are `<span>` elements with click listeners. They are invisible to keyboard users and screen readers. They should be `<button>` elements (or use `tabindex="0"` with `keydown` for Enter/Space), ideally with a proper ARIA tree pattern:

```html
<ul role="tree">
  <li role="treeitem" aria-expanded="false">
    <button>📁 Folder</button>
    <ul role="group">…</ul>
  </li>
</ul>
```

### 4.2 ARIA for Sort State — `[S]`
Sortable `<th>` elements should carry `aria-sort="ascending"` / `"descending"` / `"none"` so screen readers announce the sort direction.

### 4.3 Search Label — `[S]`
The search `<input>` inside the detail panel is created dynamically without an associated `<label>`. Add `aria-label="Search in playlist"` at minimum.

### 4.4 Table Caption — `[S]`
The track table has no `<caption>` or `aria-label`, making it anonymous to screen readers.

### 4.5 Focus Management — `[M]`
When a playlist is selected and the detail panel re-renders, focus stays on the playlist item, which is fine. But when search results update, focus jumps to the top of the page. Focus should be retained in the search input.

---

## 5. Performance

### 5.1 Virtual Scrolling for Large Libraries — `[L]`
DJ libraries can easily exceed 10 000 tracks. Rendering all rows into the DOM at once will cause visible jank. A virtual list (only rendering the ~30 visible rows) via a small library like [TanStack Virtual](https://tanstack.com/virtual) or a hand-rolled approach would fix this.

### 5.2 Debounce Search Input — `[S]`
The search input triggers a full re-render on every keystroke. A 150–200 ms debounce removes unnecessary work on fast typists.

### 5.3 Web Worker for XML Parsing — `[M]`
Parsing a large `rekordbox.xml` (can be 10+ MB) on the main thread blocks the UI. Moving `DOMParser` + the parse functions into a Web Worker keeps the page responsive during load.

---

## 6. Tooling & Developer Experience

### 6.1 Vite — `[S]`
Adding Vite gives:
- `npm run dev` with hot-reload (no more manual `python -m http.server`)
- A proper build step (`npm run build`) for production with cache-busted filenames
- Easy path to TypeScript or PostCSS if needed later

### 6.2 GitHub Actions CI — `[S]`
A minimal workflow that runs `npm test` and `npm run lint` on every push/PR catches regressions before merge. Since the project is already on GitHub Pages, adding a deployment step (`actions/deploy-pages`) is trivial.

### 6.3 `package.json` Scripts — `[S]`
Currently there is no `package.json`. Even if no bundler is added, a `package.json` centralises the dev server, test, and lint commands so contributors don't need to read the README to get started.

### 6.4 `.editorconfig` / Prettier Config — `[S]`
Ensures consistent indentation and line endings regardless of the editor used.

---

## 7. UX Enhancements (Non-Feature)

### 7.1 Drag-to-Resize Panels — `[M]`
The fixed 260–360 px sidebar is inconvenient for deep folder trees. A CSS resize handle or a JS splitter would let users adjust it.

### 7.2 Persist Expanded/Selected State — `[M]`
After loading a file, collapsing folders and selecting a playlist is lost on page refresh. Using `sessionStorage` to persist the active playlist and folder-open state would make repeated use much smoother.

### 7.3 Copy File Path — `[S]`
The `Location` column shows the decoded file path but clicking it does nothing. A short-click-to-copy (using the Clipboard API) would be genuinely useful for locating missing files.

### 7.4 Rating Display — `[S]`
Rekordbox stores `Rating` as an integer (0, 51, 102, 153, 204, 255 → 0–5 stars). Rendering it as ★ symbols instead of the raw number is a small improvement.

### 7.5 Highlight Tracks Without a Match — `[S]`
If a track ID referenced by a playlist doesn't exist in the collection, `trackMap.get(id)` returns `undefined` and is silently skipped. A visual indicator (e.g., a greyed-out row with "Missing track") would surface data integrity issues.

---

## 8. Documentation

### 8.1 JSDoc on Public Functions — `[S]`
The core parse and render functions have no documentation. Even one-line JSDoc comments clarify intent (especially the `mapPlaylistNode` type union).

### 8.2 `CONTRIBUTING.md` — `[S]`
A short guide covering how to run locally, run tests, and the branching/PR convention lowers the barrier for contributions.

### 8.3 `LICENSE` File — `[S]`
The repo currently has no license, meaning all rights are reserved by default. Adding an MIT or similar open-source license is especially important since the project is hosted publicly on GitHub Pages.

---

## Priority Summary

| Priority | Item |
|---|---|
| **Fix now** | 2.1 Windows path bug, 2.2 trackMap recreation, 2.3 column sync |
| **High value, low effort** | 1.1 Unit tests + Vitest, 3.3 ESLint/Prettier, 6.2 CI, 8.3 LICENSE |
| **High value, medium effort** | 3.1 ES modules, 4.1 Keyboard/ARIA tree, 6.1 Vite |
| **Nice to have** | 5.1 Virtual scrolling, 7.2 Persist state, 7.3 Copy path |
| **Longer term** | 3.2 TypeScript, 5.3 Web Worker, 1.3 Playwright E2E |
