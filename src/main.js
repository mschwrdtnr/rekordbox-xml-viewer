import { countPlaylists, parsePlaylists, parseTracks } from "./parser.js";
import { renderPlaylists } from "./render.js";

const fileInput = document.getElementById("xmlFile");
const statusText = document.getElementById("status");
const overviewEl = document.getElementById("overview");
const trackCountEl = document.getElementById("trackCount");
const playlistCountEl = document.getElementById("playlistCount");
const playlistsSection = document.getElementById("playlistsSection");
const playlistsContainer = document.getElementById("playlists");

const state = {
  allTracks: [],
  trackMap: new Map(),
  detailSortState: { col: null, dir: "asc" },
};

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const xmlText = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("The XML file could not be parsed.");
    }

    const tracks = parseTracks(xmlDoc);
    const playlistTree = parsePlaylists(xmlDoc);

    state.allTracks = tracks;
    state.trackMap = new Map(tracks.map((t) => [t.id, t]));

    renderPlaylists(playlistsContainer, playlistTree, state);

    trackCountEl.textContent = String(tracks.length);
    playlistCountEl.textContent = String(countPlaylists(playlistTree));

    overviewEl.hidden = false;
    playlistsSection.hidden = false;

    setStatus(`File loaded: ${file.name}`, "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Unexpected error reading the file.", "error");
  }
});

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = `status ${type}`;
}
