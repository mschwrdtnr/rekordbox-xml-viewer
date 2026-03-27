export function formatDuration(seconds) {
  const asNumber = Number.parseInt(seconds, 10);
  if (Number.isNaN(asNumber)) {
    return "";
  }

  const mins = Math.floor(asNumber / 60)
    .toString()
    .padStart(2, "0");
  const secs = (asNumber % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function durationToSeconds(dur) {
  if (!dur) return 0;
  const [mins, secs] = dur.split(":").map(Number);
  return (mins || 0) * 60 + (secs || 0);
}

export function decodeLocation(location) {
  if (!location) return "";

  const withoutPrefix = location.startsWith("file://localhost/")
    ? location.slice("file://localhost/".length)
    : location.replace(/^file:\/\//, "");
  try {
    return decodeURIComponent(withoutPrefix);
  } catch {
    return withoutPrefix;
  }
}
