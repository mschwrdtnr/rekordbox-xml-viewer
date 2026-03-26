const fileInput = document.getElementById('xmlFile');
const statusText = document.getElementById('status');
const overview = document.getElementById('overview');
const trackCount = document.getElementById('trackCount');
const playlistCount = document.getElementById('playlistCount');
const playlistsSection = document.getElementById('playlistsSection');
const playlistsContainer = document.getElementById('playlists');

let allTracks = [];
let detailSortState = { col: null, dir: 'asc' };

fileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const xmlText = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('The XML file could not be parsed.');
    }

    const tracks = parseTracks(xmlDoc);
    const playlistTree = parsePlaylists(xmlDoc);

    allTracks = tracks;
    renderPlaylists(playlistTree);

    trackCount.textContent = String(tracks.length);
    playlistCount.textContent = String(countPlaylists(playlistTree));

    overview.hidden = false;
    playlistsSection.hidden = false;

    setStatus(`File loaded: ${file.name}`, 'success');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unexpected error reading the file.', 'error');
  }
});

function parseTracks(xmlDoc) {
  const trackNodes = [...xmlDoc.querySelectorAll('COLLECTION > TRACK')];
  return trackNodes.map((trackNode) => ({
    id: trackNode.getAttribute('TrackID') || '',
    name: trackNode.getAttribute('Name') || '',
    artist: trackNode.getAttribute('Artist') || '',
    album: trackNode.getAttribute('Album') || '',
    genre: trackNode.getAttribute('Genre') || '',
    bpm: trackNode.getAttribute('AverageBpm') || '',
    tonalKey: trackNode.getAttribute('Tonality') || '',
    rating: trackNode.getAttribute('Rating') || '',
    bitrate: trackNode.getAttribute('BitRate') || '',
    duration: formatDuration(trackNode.getAttribute('TotalTime')),
    location: decodeLocation(trackNode.getAttribute('Location') || ''),
  }));
}

function parsePlaylists(xmlDoc) {
  const rootNode = xmlDoc.querySelector('PLAYLISTS > NODE');
  if (!rootNode) {
    return [];
  }

  return [...rootNode.children]
    .filter((node) => node.tagName === 'NODE')
    .map((node) => mapPlaylistNode(node));
}

function mapPlaylistNode(node) {
  const type = node.getAttribute('Type');
  const name = node.getAttribute('Name') || 'Unnamed';

  if (type === '0') {
    const children = [...node.children]
      .filter((child) => child.tagName === 'NODE')
      .map((child) => mapPlaylistNode(child));

    return { type: 'folder', name, children };
  }

  const tracks = [...node.querySelectorAll(':scope > TRACK')].map((trackRef) =>
    trackRef.getAttribute('Key')
  );
  return { type: 'playlist', name, tracks };
}

function countPlaylists(tree) {
  return tree.reduce((count, node) => {
    if (node.type === 'playlist') {
      return count + 1;
    }
    return count + countPlaylists(node.children);
  }, 0);
}

function renderPlaylists(tree) {
  playlistsContainer.innerHTML = '';

  const list = document.createElement('ul');
  list.className = 'playlist-tree';

  const allTracksNode = {
    type: 'playlist',
    name: 'All Tracks',
    tracks: allTracks.map((t) => t.id),
    isAllTracks: true,
  };
  list.appendChild(createPlaylistNodeElement(allTracksNode));

  tree.forEach((node) => {
    list.appendChild(createPlaylistNodeElement(node));
  });

  playlistsContainer.appendChild(list);
}

function createPlaylistNodeElement(node) {
  const listItem = document.createElement('li');

  if (node.type === 'folder') {
    const title = document.createElement('span');
    title.className = 'playlist-folder';
    title.textContent = `📁 ${node.name}`;
    listItem.appendChild(title);

    const nested = document.createElement('ul');
    nested.className = 'playlist-tree playlist-tree--collapsed';

    node.children.forEach((child) => {
      nested.appendChild(createPlaylistNodeElement(child));
    });

    title.addEventListener('click', () => {
      const isCollapsed = nested.classList.toggle('playlist-tree--collapsed');
      title.classList.toggle('playlist-folder--open', !isCollapsed);
    });

    listItem.appendChild(nested);
  } else {
    const playlist = document.createElement('span');
    playlist.className = 'playlist-leaf';
    const icon = node.isAllTracks ? '🎶' : '🎵';
    playlist.textContent = `${icon} ${node.name} (${node.tracks.length} tracks)`;

    playlist.addEventListener('click', () => {
      document.querySelectorAll('.playlist-leaf--active').forEach((el) =>
        el.classList.remove('playlist-leaf--active')
      );
      playlist.classList.add('playlist-leaf--active');
      detailSortState = { col: null, dir: 'asc' };
      renderPlaylistDetail(node);
    });

    listItem.appendChild(playlist);
  }

  return listItem;
}

const DETAIL_COLUMNS = [
  { label: '#', key: null },
  { label: 'Title', key: 'name' },
  { label: 'Artist', key: 'artist' },
  { label: 'Album', key: 'album' },
  { label: 'Genre', key: 'genre' },
  { label: 'BPM', key: 'bpm' },
  { label: 'Key', key: 'tonalKey' },
  { label: 'Bitrate', key: 'bitrate' },
  { label: 'Duration', key: 'duration' },
];

function renderPlaylistDetail(node, filterQuery = '') {
  const panel = document.getElementById('playlistDetail');
  panel.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'detail-header';

  const heading = document.createElement('h3');
  const icon = node.isAllTracks ? '🎶' : '🎵';
  heading.textContent = `${icon} ${node.name}`;
  header.appendChild(heading);

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'detail-search';
  searchInput.placeholder = 'Search in playlist...';
  searchInput.value = filterQuery;
  header.appendChild(searchInput);

  panel.appendChild(header);

  const trackMap = new Map(allTracks.map((t) => [t.id, t]));
  let tracks = node.isAllTracks
    ? [...allTracks]
    : node.tracks.map((id) => trackMap.get(id)).filter(Boolean);

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    tracks = tracks.filter((t) =>
      [t.name, t.artist, t.album].join(' ').toLowerCase().includes(q)
    );
  }

  if (detailSortState.col) {
    const key = detailSortState.col;
    const numericKeys = new Set(['bpm', 'bitrate']);
    tracks = [...tracks].sort((a, b) => {
      let av = a[key] ?? '';
      let bv = b[key] ?? '';
      if (numericKeys.has(key)) {
        av = parseFloat(av) || 0;
        bv = parseFloat(bv) || 0;
      } else if (key === 'duration') {
        av = durationToSeconds(av);
        bv = durationToSeconds(bv);
      } else {
        av = av.toString().toLowerCase();
        bv = bv.toString().toLowerCase();
      }
      if (av < bv) return detailSortState.dir === 'asc' ? -1 : 1;
      if (av > bv) return detailSortState.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (!tracks.length) {
    const hint = document.createElement('p');
    hint.textContent = filterQuery ? 'No tracks match your search.' : 'No tracks in this playlist.';
    hint.className = 'playlist-detail-hint';
    panel.appendChild(hint);
    searchInput.addEventListener('input', () => renderPlaylistDetail(node, searchInput.value.trim()));
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  DETAIL_COLUMNS.forEach((col) => {
    const th = document.createElement('th');
    th.textContent = col.label;
    if (col.key !== null) {
      th.className = 'sortable';
      if (detailSortState.col === col.key) {
        th.classList.add(detailSortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
      th.addEventListener('click', () => {
        if (detailSortState.col === col.key) {
          if (detailSortState.dir === 'asc') {
            detailSortState.dir = 'desc';
          } else {
            // third click: reset to playlist order
            detailSortState.col = null;
            detailSortState.dir = 'asc';
          }
        } else {
          detailSortState.col = col.key;
          detailSortState.dir = 'asc';
        }
        renderPlaylistDetail(node, searchInput.value.trim());
      });
    }
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tracks.forEach((track, index) => {
    const row = document.createElement('tr');
    [
      index + 1,
      track.name,
      track.artist,
      track.album,
      track.genre,
      track.bpm,
      track.tonalKey,
      track.bitrate ? `${track.bitrate} kbps` : '',
      track.duration,
    ].forEach((val) => {
      const td = document.createElement('td');
      td.textContent = val;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  wrap.appendChild(table);
  panel.appendChild(wrap);

  searchInput.addEventListener('input', () => renderPlaylistDetail(node, searchInput.value.trim()));
}

function durationToSeconds(dur) {
  if (!dur) return 0;
  const [mins, secs] = dur.split(':').map(Number);
  return (mins || 0) * 60 + (secs || 0);
}

function formatDuration(seconds) {
  const asNumber = Number.parseInt(seconds, 10);
  if (Number.isNaN(asNumber)) {
    return '';
  }

  const mins = Math.floor(asNumber / 60)
    .toString()
    .padStart(2, '0');
  const secs = (asNumber % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function decodeLocation(location) {
  if (!location) return '';

  const withoutPrefix = location.replace('file://localhost/', '/');
  try {
    return decodeURIComponent(withoutPrefix);
  } catch {
    return withoutPrefix;
  }
}

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = `status ${type}`;
}
