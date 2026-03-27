import { durationToSeconds } from "./utils.js";

const DETAIL_COLUMNS = [
  { label: "#", key: null, getValue: (_track, index) => index + 1 },
  { label: "Title", key: "name", getValue: (track) => track.name },
  { label: "Artist", key: "artist", getValue: (track) => track.artist },
  { label: "Album", key: "album", getValue: (track) => track.album },
  { label: "Genre", key: "genre", getValue: (track) => track.genre },
  { label: "BPM", key: "bpm", getValue: (track) => track.bpm },
  { label: "Key", key: "tonalKey", getValue: (track) => track.tonalKey },
  {
    label: "Bitrate",
    key: "bitrate",
    getValue: (track) => (track.bitrate ? `${track.bitrate} kbps` : ""),
  },
  { label: "Duration", key: "duration", getValue: (track) => track.duration },
];

export function renderPlaylists(container, tree, state) {
  container.innerHTML = "";

  const list = document.createElement("ul");
  list.className = "playlist-tree";

  const allTracksNode = {
    type: "playlist",
    name: "All Tracks",
    tracks: state.allTracks.map((t) => t.id),
    isAllTracks: true,
  };
  list.appendChild(createPlaylistNodeElement(allTracksNode, state));

  tree.forEach((node) => {
    list.appendChild(createPlaylistNodeElement(node, state));
  });

  container.appendChild(list);
}

function createPlaylistNodeElement(node, state) {
  const listItem = document.createElement("li");

  if (node.type === "folder") {
    const title = document.createElement("span");
    title.className = "playlist-folder";
    title.textContent = `📁 ${node.name}`;
    listItem.appendChild(title);

    const nested = document.createElement("ul");
    nested.className = "playlist-tree playlist-tree--collapsed";

    node.children.forEach((child) => {
      nested.appendChild(createPlaylistNodeElement(child, state));
    });

    title.addEventListener("click", () => {
      const isCollapsed = nested.classList.toggle("playlist-tree--collapsed");
      title.classList.toggle("playlist-folder--open", !isCollapsed);
    });

    listItem.appendChild(nested);
  } else {
    const playlist = document.createElement("span");
    playlist.className = "playlist-leaf";
    const icon = node.isAllTracks ? "🎶" : "🎵";
    playlist.textContent = `${icon} ${node.name} (${node.tracks.length} tracks)`;

    playlist.addEventListener("click", () => {
      document.querySelectorAll(".playlist-leaf--active").forEach((el) => {
        el.classList.remove("playlist-leaf--active");
      });
      playlist.classList.add("playlist-leaf--active");
      state.detailSortState.col = null;
      state.detailSortState.dir = "asc";
      renderPlaylistDetail(
        document.getElementById("playlistDetail"),
        node,
        state,
      );
    });

    listItem.appendChild(playlist);
  }

  return listItem;
}

function renderPlaylistDetail(panel, node, state, filterQuery = "") {
  panel.innerHTML = "";

  const header = document.createElement("div");
  header.className = "detail-header";

  const heading = document.createElement("h3");
  const icon = node.isAllTracks ? "🎶" : "🎵";
  heading.textContent = `${icon} ${node.name}`;
  header.appendChild(heading);

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.className = "detail-search";
  searchInput.placeholder = "Search in playlist...";
  searchInput.value = filterQuery;
  header.appendChild(searchInput);

  panel.appendChild(header);

  let tracks = node.isAllTracks
    ? [...state.allTracks]
    : node.tracks.map((id) => state.trackMap.get(id)).filter(Boolean);

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    tracks = tracks.filter((t) =>
      [t.name, t.artist, t.album].join(" ").toLowerCase().includes(q),
    );
  }

  if (state.detailSortState.col) {
    const key = state.detailSortState.col;
    const numericKeys = new Set(["bpm", "bitrate"]);
    tracks = [...tracks].sort((a, b) => {
      let av = a[key] ?? "";
      let bv = b[key] ?? "";
      if (numericKeys.has(key)) {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
      } else if (key === "duration") {
        av = durationToSeconds(av);
        bv = durationToSeconds(bv);
      } else {
        av = av.toString().toLowerCase();
        bv = bv.toString().toLowerCase();
      }
      if (av < bv) return state.detailSortState.dir === "asc" ? -1 : 1;
      if (av > bv) return state.detailSortState.dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  if (!tracks.length) {
    const hint = document.createElement("p");
    hint.textContent = filterQuery
      ? "No tracks match your search."
      : "No tracks in this playlist.";
    hint.className = "playlist-detail-hint";
    panel.appendChild(hint);
    searchInput.addEventListener("input", () =>
      renderPlaylistDetail(panel, node, state, searchInput.value.trim()),
    );
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  DETAIL_COLUMNS.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    if (col.key !== null) {
      th.className = "sortable";
      if (state.detailSortState.col === col.key) {
        th.classList.add(
          state.detailSortState.dir === "asc" ? "sort-asc" : "sort-desc",
        );
      }
      th.addEventListener("click", () => {
        if (state.detailSortState.col === col.key) {
          if (state.detailSortState.dir === "asc") {
            state.detailSortState.dir = "desc";
          } else {
            state.detailSortState.col = null;
            state.detailSortState.dir = "asc";
          }
        } else {
          state.detailSortState.col = col.key;
          state.detailSortState.dir = "asc";
        }
        renderPlaylistDetail(panel, node, state, searchInput.value.trim());
      });
    }
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tracks.forEach((track, index) => {
    const row = document.createElement("tr");
    DETAIL_COLUMNS.forEach((col) => {
      const td = document.createElement("td");
      td.textContent = col.getValue(track, index);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  wrap.appendChild(table);
  panel.appendChild(wrap);

  searchInput.addEventListener("input", () =>
    renderPlaylistDetail(panel, node, state, searchInput.value.trim()),
  );
}
