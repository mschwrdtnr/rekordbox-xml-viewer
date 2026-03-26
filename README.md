# Rekordbox XML Library Viewer

A simple website to load a `rekordbox.xml` in the browser and browse your library. Hosted on GitHub Pages — no setup required, works on mobile too.

## Features

- **Track library** with all properties: title, artist, album, genre, BPM, key, bitrate, duration, file path
- **Playlist structure** — folders and playlists with track counts, collapsible
- **"All Tracks"** view across the entire library
- **Column sorting** by clicking headers (ascending/descending, third click resets)
- **Search** within a playlist

## Local Development

As it's a static website, a simple HTTP server is enough:

```bash
python -m http.server 8000
```

Then open in your browser: `http://localhost:8000`

## Next Steps

The current version focuses on **reading and displaying** the XML.
The next step could be adding edit functionality to export a new XML for re-import into Rekordbox.
