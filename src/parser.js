import { decodeLocation, formatDuration } from "./utils.js";

export function parseTracks(xmlDoc) {
  const trackNodes = [...xmlDoc.querySelectorAll("COLLECTION > TRACK")];
  return trackNodes.map((trackNode) => ({
    id: trackNode.getAttribute("TrackID") || "",
    name: trackNode.getAttribute("Name") || "",
    artist: trackNode.getAttribute("Artist") || "",
    album: trackNode.getAttribute("Album") || "",
    genre: trackNode.getAttribute("Genre") || "",
    bpm: trackNode.getAttribute("AverageBpm") || "",
    tonalKey: trackNode.getAttribute("Tonality") || "",
    rating: trackNode.getAttribute("Rating") || "",
    bitrate: trackNode.getAttribute("BitRate") || "",
    duration: formatDuration(trackNode.getAttribute("TotalTime")),
    location: decodeLocation(trackNode.getAttribute("Location") || ""),
  }));
}

export function parsePlaylists(xmlDoc) {
  const rootNode = xmlDoc.querySelector("PLAYLISTS > NODE");
  if (!rootNode) {
    return [];
  }

  return [...rootNode.children]
    .filter((node) => node.tagName === "NODE")
    .map((node) => mapPlaylistNode(node));
}

export function mapPlaylistNode(node) {
  const type = node.getAttribute("Type");
  const name = node.getAttribute("Name") || "Unnamed";

  if (type === "0") {
    const children = [...node.children]
      .filter((child) => child.tagName === "NODE")
      .map((child) => mapPlaylistNode(child));

    return { type: "folder", name, children };
  }

  const tracks = [...node.querySelectorAll(":scope > TRACK")].map((trackRef) =>
    trackRef.getAttribute("Key"),
  );
  return { type: "playlist", name, tracks };
}

export function countPlaylists(tree) {
  return tree.reduce((count, node) => {
    if (node.type === "playlist") {
      return count + 1;
    }
    return count + countPlaylists(node.children);
  }, 0);
}
