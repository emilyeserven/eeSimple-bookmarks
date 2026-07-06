// @vitest-environment node
import { describe, expect, it } from "vitest";

import { computeBookmarksSharingMediaSource } from "./useBookmarksSharingMediaSource";
import { makeBookmark } from "../test-utils/factories";

describe("computeBookmarksSharingMediaSource", () => {
  it("finds other bookmarks sharing a set identity field, excluding the bookmark itself", () => {
    const shared = makeBookmark({
      id: "a",
      plexRatingKey: "123",
    });
    const other = makeBookmark({
      id: "b",
      plexRatingKey: "123",
    });
    const unrelated = makeBookmark({
      id: "c",
      plexRatingKey: "456",
    });
    const result = computeBookmarksSharingMediaSource(shared, [shared, other, unrelated]);
    expect(result).toEqual([{
      field: "plexRatingKey",
      value: "123",
      bookmarks: [other],
    }]);
  });

  it("returns an empty array when no identity field is set", () => {
    const bookmark = makeBookmark({
      id: "a",
    });
    expect(computeBookmarksSharingMediaSource(bookmark, [bookmark])).toEqual([]);
  });

  it("omits a field with no other matching bookmark", () => {
    const bookmark = makeBookmark({
      id: "a",
      isbn: "9780134685991",
    });
    expect(computeBookmarksSharingMediaSource(bookmark, [bookmark])).toEqual([]);
  });

  it("reports each set identity field independently", () => {
    const bookmark = makeBookmark({
      id: "a",
      isbn: "9780134685991",
      feedUrl: "https://example.com/feed.xml",
    });
    const isbnMatch = makeBookmark({
      id: "b",
      isbn: "9780134685991",
    });
    const feedMatch = makeBookmark({
      id: "c",
      feedUrl: "https://example.com/feed.xml",
    });
    const result = computeBookmarksSharingMediaSource(bookmark, [bookmark, isbnMatch, feedMatch]);
    expect(result).toEqual([
      {
        field: "isbn",
        value: "9780134685991",
        bookmarks: [isbnMatch],
      },
      {
        field: "feedUrl",
        value: "https://example.com/feed.xml",
        bookmarks: [feedMatch],
      },
    ]);
  });
});
