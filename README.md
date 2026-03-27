# Rekordbox XML Library Viewer

A simple website to load a `rekordbox.xml` in the browser and browse your library. Hosted on GitHub Pages — no setup required, works on mobile too.
TYou could regularly safe your `rekordbox.xml` on your mobile phone and check your library on the go.

**Try it here:** [mschwrdtnr.github.io/rekordbox-xml-viewer](https://mschwrdtnr.github.io/rekordbox-xml-viewer/)

## How to Use

1. Open the link above in any desktop or mobile browser
2. Click the file input and select your `rekordbox.xml` file
3. Browse your tracks and playlists — everything stays in your browser, nothing is uploaded

### Where to find your rekordbox.xml

In Rekordbox, go to **File → Export Collection in xml format** and save the file. Then load it in the viewer.

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
