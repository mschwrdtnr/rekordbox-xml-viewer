import { describe, expect, it, vi } from "vitest";
import {
  debounce,
  decodeLocation,
  durationToSeconds,
  formatDuration,
} from "../src/utils.js";

describe("formatDuration", () => {
  it("formats seconds into mm:ss", () => {
    expect(formatDuration("125")).toBe("02:05");
    expect(formatDuration("0")).toBe("00:00");
    expect(formatDuration("3600")).toBe("60:00");
  });

  it("pads single-digit values", () => {
    expect(formatDuration("65")).toBe("01:05");
  });

  it("returns empty string for NaN input", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(undefined)).toBe("");
    expect(formatDuration("abc")).toBe("");
  });
});

describe("durationToSeconds", () => {
  it("converts mm:ss to total seconds", () => {
    expect(durationToSeconds("02:05")).toBe(125);
    expect(durationToSeconds("00:00")).toBe(0);
  });

  it("returns 0 for falsy input", () => {
    expect(durationToSeconds("")).toBe(0);
    expect(durationToSeconds(undefined)).toBe(0);
    expect(durationToSeconds(null)).toBe(0);
  });
});

describe("decodeLocation", () => {
  it("returns empty string for falsy input", () => {
    expect(decodeLocation("")).toBe("");
    expect(decodeLocation(null)).toBe("");
    expect(decodeLocation(undefined)).toBe("");
  });

  it("strips file://localhost/ prefix for Windows paths", () => {
    expect(decodeLocation("file://localhost/C:/Music/track.mp3")).toBe(
      "C:/Music/track.mp3",
    );
  });

  it("does not prepend slash for Windows drive letters", () => {
    const result = decodeLocation("file://localhost/C:/Music/My%20Track.mp3");
    expect(result).toBe("C:/Music/My Track.mp3");
    expect(result).not.toMatch(/^\/[A-Z]:/);
  });

  it("strips file://localhost/ for Unix-style paths", () => {
    expect(
      decodeLocation("file://localhost/Users/dj/My%20Music/track.mp3"),
    ).toBe("Users/dj/My Music/track.mp3");
  });

  it("handles file:// without localhost", () => {
    expect(decodeLocation("file:///Users/dj/music.mp3")).toBe(
      "/Users/dj/music.mp3",
    );
  });

  it("returns path as-is when decoding fails", () => {
    expect(decodeLocation("file://localhost/%ZZ")).toBe("%ZZ");
  });
});

describe("debounce", () => {
  it("delays execution until after the wait period", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 150);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("resets the timer on repeated calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 150);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("passes arguments to the original function", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced("a", "b");
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a", "b");
    vi.useRealTimers();
  });
});
