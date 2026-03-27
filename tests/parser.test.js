import { describe, expect, it } from "vitest";
import { countPlaylists, parsePlaylists, parseTracks } from "../src/parser.js";

function createXmlDoc(xmlString) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, "application/xml");
}

const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS>
  <COLLECTION Entries="2">
    <TRACK TrackID="1" Name="Track One" Artist="Artist A" Album="Album X"
           Genre="House" AverageBpm="128.00" Tonality="Am" Rating="255"
           BitRate="320" TotalTime="180"
           Location="file://localhost/C:/Music/track1.mp3" />
    <TRACK TrackID="2" Name="Track Two" Artist="Artist B" Album=""
           Genre="" AverageBpm="" Tonality="" Rating="0"
           BitRate="" TotalTime=""
           Location="" />
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT">
      <NODE Type="0" Name="My Folder">
        <NODE Type="1" Name="Chill" Entries="1">
          <TRACK Key="1" />
        </NODE>
      </NODE>
      <NODE Type="1" Name="Party" Entries="2">
        <TRACK Key="1" />
        <TRACK Key="2" />
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;

describe("parseTracks", () => {
  it("extracts all track attributes", () => {
    const doc = createXmlDoc(FIXTURE_XML);
    const tracks = parseTracks(doc);

    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toMatchObject({
      id: "1",
      name: "Track One",
      artist: "Artist A",
      album: "Album X",
      genre: "House",
      bpm: "128.00",
      tonalKey: "Am",
      rating: "255",
      bitrate: "320",
      duration: "03:00",
      location: "C:/Music/track1.mp3",
    });
  });

  it("falls back to empty string for missing attributes", () => {
    const doc = createXmlDoc(FIXTURE_XML);
    const tracks = parseTracks(doc);

    expect(tracks[1].album).toBe("");
    expect(tracks[1].genre).toBe("");
    expect(tracks[1].bpm).toBe("");
    expect(tracks[1].duration).toBe("");
  });

  it("returns empty array for empty collection", () => {
    const doc = createXmlDoc(
      "<DJ_PLAYLISTS><COLLECTION></COLLECTION></DJ_PLAYLISTS>",
    );
    expect(parseTracks(doc)).toEqual([]);
  });
});

describe("parsePlaylists", () => {
  it("parses folder and playlist structure", () => {
    const doc = createXmlDoc(FIXTURE_XML);
    const tree = parsePlaylists(doc);

    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({ type: "folder", name: "My Folder" });
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0]).toMatchObject({
      type: "playlist",
      name: "Chill",
    });
    expect(tree[1]).toMatchObject({ type: "playlist", name: "Party" });
  });

  it("extracts track keys from playlists", () => {
    const doc = createXmlDoc(FIXTURE_XML);
    const tree = parsePlaylists(doc);

    expect(tree[0].children[0].tracks).toEqual(["1"]);
    expect(tree[1].tracks).toEqual(["1", "2"]);
  });

  it("returns empty array when PLAYLISTS node is missing", () => {
    const doc = createXmlDoc("<DJ_PLAYLISTS></DJ_PLAYLISTS>");
    expect(parsePlaylists(doc)).toEqual([]);
  });
});

describe("countPlaylists", () => {
  it("counts playlists including nested ones", () => {
    const tree = [
      {
        type: "folder",
        name: "F",
        children: [
          { type: "playlist", name: "P1", tracks: [] },
          { type: "playlist", name: "P2", tracks: [] },
        ],
      },
      { type: "playlist", name: "P3", tracks: [] },
    ];
    expect(countPlaylists(tree)).toBe(3);
  });

  it("returns 0 for empty tree", () => {
    expect(countPlaylists([])).toBe(0);
  });
});
