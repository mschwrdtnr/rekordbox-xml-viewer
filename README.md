# Rekordbox XML Library Viewer

Eine einfache Website, um eine `rekordbox.xml` lokal im Browser zu laden und folgende Daten sichtbar zu machen:

- komplette Track-Library (inkl. Properties wie Titel, Artist, Album, Genre, BPM, Tonart, Rating, Dauer, Dateipfad)
- Playlist-Struktur (Ordner + Playlists inkl. Track-Anzahl)

## Starten

Da es eine statische Website ist, reicht ein einfacher HTTP-Server:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

- `http://localhost:8000`

## Nächste Ausbaustufe

Die aktuelle Version fokussiert auf das **Lesen und Anzeigen** der XML.
Als nächster Schritt kann die Datenstruktur um Edit-Funktionen erweitert werden, um anschließend eine neue XML für den Re-Import in Rekordbox zu exportieren.
