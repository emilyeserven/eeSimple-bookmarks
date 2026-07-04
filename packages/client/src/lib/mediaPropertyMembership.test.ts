// @vitest-environment node
import { describe, expect, it } from "vitest";

import { bookmarksForMediaProperty, memberItemIdsByType } from "./mediaPropertyMembership";
import type { MediaPropertyLists } from "./mediaPropertyMembership";
import { makeBookmark } from "../test-utils/factories";

/** A minimal media-item row — the helpers only read `id` + `mediaPropertyId`. */
const item = (id: string, mediaPropertyId: string | null) => ({
  id,
  mediaPropertyId,
});

const lists = (partial: Record<string, { id: string;
  mediaPropertyId: string | null; }[]>) =>
  partial as unknown as Partial<MediaPropertyLists>;

describe("memberItemIdsByType", () => {
  it("collects only the item ids grouped under the given property, per kind", () => {
    const members = memberItemIdsByType("p1", lists({
      movies: [item("m1", "p1"), item("m2", "p2"), item("m3", null)],
      books: [item("bk1", "p1"), item("bk2", "p1")],
      tracks: [item("t1", "p9")],
    }));

    expect([...members.movieIds]).toEqual(["m1"]);
    expect([...members.bookIds].sort()).toEqual(["bk1", "bk2"]);
    expect(members.trackIds.size).toBe(0);
  });

  it("returns empty sets for kinds not provided", () => {
    const members = memberItemIdsByType("p1", {});
    expect(members.movieIds.size).toBe(0);
    expect(members.podcastIds.size).toBe(0);
  });
});

describe("bookmarksForMediaProperty", () => {
  it("keeps bookmarks whose linked media item is a member, across FK kinds", () => {
    const members = memberItemIdsByType("p1", lists({
      movies: [item("m1", "p1")],
      books: [item("bk1", "p1")],
    }));

    const inByMovie = makeBookmark({
      id: "1",
      movieId: "m1",
    });
    const inByBook = makeBookmark({
      id: "2",
      bookId: "bk1",
    });
    const outWrongProperty = makeBookmark({
      id: "3",
      movieId: "m9",
    });
    const outNoLink = makeBookmark({
      id: "4",
    });

    const result = bookmarksForMediaProperty(
      [inByMovie, inByBook, outWrongProperty, outNoLink],
      members,
    );

    expect(result.map(b => b.id)).toEqual(["1", "2"]);
  });

  it("returns nothing when the property has no member items", () => {
    const members = memberItemIdsByType("p1", {});
    const result = bookmarksForMediaProperty([makeBookmark({
      movieId: "m1",
    })], members);
    expect(result).toEqual([]);
  });
});
