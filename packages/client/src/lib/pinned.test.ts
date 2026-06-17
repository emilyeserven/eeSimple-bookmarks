import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { sortPinnedBookmarks } from "./pinned";

function makeBookmark(overrides: Partial<Bookmark>): Bookmark {
  return {
    id: overrides.id ?? "id",
    url: "https://example.com",
    title: overrides.title ?? "Example",
    description: null,
    tags: [],
    favorite: false,
    pinned: true,
    priority: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sortPinnedBookmarks", () => {
  it("keeps only pinned bookmarks", () => {
    const result = sortPinnedBookmarks([
      makeBookmark({
        id: "a",
        pinned: true,
      }),
      makeBookmark({
        id: "b",
        pinned: false,
      }),
    ]);
    expect(result.map(bookmark => bookmark.id)).toEqual(["a"]);
  });

  it("orders by priority, highest first", () => {
    const result = sortPinnedBookmarks([
      makeBookmark({
        id: "low",
        priority: 1,
      }),
      makeBookmark({
        id: "high",
        priority: 10,
      }),
      makeBookmark({
        id: "mid",
        priority: 5,
      }),
    ]);
    expect(result.map(bookmark => bookmark.id)).toEqual(["high", "mid", "low"]);
  });

  it("breaks priority ties by newest createdAt first", () => {
    const result = sortPinnedBookmarks([
      makeBookmark({
        id: "older",
        priority: 5,
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      makeBookmark({
        id: "newer",
        priority: 5,
        createdAt: "2026-02-01T00:00:00.000Z",
      }),
    ]);
    expect(result.map(bookmark => bookmark.id)).toEqual(["newer", "older"]);
  });
});
