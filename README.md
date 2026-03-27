# Rekordbox XML Library Viewer

A simple website to load a `rekordbox.xml` in the browser and browse your library. Hosted on GitHub Pages — no setup required, works on mobile too.

## Features

- **Track library** with all properties: title, artist, album, genre, BPM, key, bitrate, duration, file path
- **Playlist structure** — folders and playlists with track counts, collapsible
- **"All Tracks"** view across the entire library
- **Column sorting** by clicking headers (ascending/descending, third click resets)
- **Search** within a playlist

## Local Development

```bash
npm install
npm run dev
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot-reload |
| `npm run build` | Build for production into `dist/` |
| `npm test` | Run unit tests (Vitest) |
| `npm run lint` | Lint and check formatting (Biome) |
| `npm run format` | Auto-fix lint and formatting issues |

## Next Steps

The current version focuses on **reading and displaying** the XML.
The next step could be adding edit functionality to export a new XML for re-import into Rekordbox.
