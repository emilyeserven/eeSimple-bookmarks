// @vitest-environment node
import { describe, expect, it } from "vitest";

import { type MediaLists, mediaItemsForBookmarks } from "./mediaItemsForBookmarks";
import { makeBookmark } from "../test-utils/factories";

const EMPTY_LISTS: MediaLists = {
  movies: [],
  tvShows: [],
  episodes: [],
  albums: [],
  tracks: [],
  books: [],
  podcasts: [],
};

describe("mediaItemsForBookmarks", () => {
  it("returns nothing for an empty bookmark set", () => {
    expect(mediaItemsForBookmarks([], EMPTY_LISTS)).toEqual([]);
  });

  it("counts how many bookmarks reference each media item and de-dups", () => {
    const lists: MediaLists = {
      ...EMPTY_LISTS,
      movies: [
        {
          id: "m1",
          slug: "inception",
          name: "Inception",
        },
        {
          id: "m2",
          slug: "matrix",
          name: "The Matrix",
        },
      ],
    };
    const bookmarks = [
      makeBookmark({
        id: "b1",
        movieId: "m1",
      }),
      makeBookmark({
        id: "b2",
        movieId: "m1",
      }),
      makeBookmark({
        id: "b3",
        movieId: "m2",
      }),
    ];

    const result = mediaItemsForBookmarks(bookmarks, lists);

    // Inception (2 matches) sorts before The Matrix (1 match).
    expect(result).toEqual([
      {
        kind: "movie",
        id: "m1",
        slug: "inception",
        name: "Inception",
        label: "Movie",
        matchCount: 2,
      },
      {
        kind: "movie",
        id: "m2",
        slug: "matrix",
        name: "The Matrix",
        label: "Movie",
        matchCount: 1,
      },
    ]);
  });

  it("ignores bookmarks with no media link", () => {
    const lists: MediaLists = {
      ...EMPTY_LISTS,
      books: [{
        id: "k1",
        slug: "dune",
        name: "Dune",
      }],
    };
    const bookmarks = [makeBookmark({
      id: "b1",
    }), makeBookmark({
      id: "b2",
      bookId: "k1",
    })];

    const result = mediaItemsForBookmarks(bookmarks, lists);

    expect(result).toEqual([
      {
        kind: "book",
        id: "k1",
        slug: "dune",
        name: "Dune",
        label: "Book",
        matchCount: 1,
      },
    ]);
  });

  it("skips referenced ids that are absent from the cached list", () => {
    const bookmarks = [makeBookmark({
      id: "b1",
      movieId: "missing",
    })];

    expect(mediaItemsForBookmarks(bookmarks, EMPTY_LISTS)).toEqual([]);
  });

  it("collects items across multiple media kinds into one flat sorted list", () => {
    const lists: MediaLists = {
      ...EMPTY_LISTS,
      movies: [{
        id: "m1",
        slug: "inception",
        name: "Inception",
      }],
      tracks: [{
        id: "t1",
        slug: "one",
        name: "One",
      }],
      podcasts: [{
        id: "p1",
        slug: "cast",
        name: "A Cast",
      }],
    };
    const bookmarks = [
      makeBookmark({
        id: "b1",
        movieId: "m1",
      }),
      makeBookmark({
        id: "b2",
        trackId: "t1",
      }),
      makeBookmark({
        id: "b3",
        trackId: "t1",
      }),
      makeBookmark({
        id: "b4",
        podcastId: "p1",
      }),
    ];

    const result = mediaItemsForBookmarks(bookmarks, lists);

    // Track "One" has 2 matches so it leads; the two single-match items tie and sort by name.
    expect(result.map(item => [item.kind, item.name, item.matchCount])).toEqual([
      ["track", "One", 2],
      ["podcast", "A Cast", 1],
      ["movie", "Inception", 1],
    ]);
  });

  describe("independent matching (issue #1027)", () => {
    const lists: MediaLists = {
      ...EMPTY_LISTS,
      movies: [
        {
          id: "m1",
          slug: "inception",
          name: "Inception",
        },
        {
          id: "m2",
          slug: "matrix",
          name: "The Matrix",
        },
      ],
    };

    it("shows every cached item with no active filters, even with zero linked bookmarks", () => {
      const result = mediaItemsForBookmarks([], lists);
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["Inception", 0],
        ["The Matrix", 0],
      ]);
    });

    it("matches an unbookmarked item by free-text query on its own name", () => {
      const result = mediaItemsForBookmarks([], lists, {}, "matrix");
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["The Matrix", 0],
      ]);
    });

    it("matches an unbookmarked item via its own Genre/Mood assignment", () => {
      const result = mediaItemsForBookmarks(
        [],
        lists,
        {
          genreMoods: ["gm1"],
        },
        "",
        {
          movie: {
            genreMoodIdsByOwner: {
              m1: ["gm1"],
            },
            placeTypeKeysByOwner: {},
            languageUsagesByOwner: {},
          },
        },
      );
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["Inception", 0],
      ]);
    });

    it("matches an unbookmarked item via its own place-type (location) assignment", () => {
      const result = mediaItemsForBookmarks(
        [],
        lists,
        {
          placeTypes: ["city"],
        },
        "",
        {
          movie: {
            genreMoodIdsByOwner: {},
            placeTypeKeysByOwner: {
              m2: ["city"],
            },
            languageUsagesByOwner: {},
          },
        },
      );
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["The Matrix", 0],
      ]);
    });

    it("matches an unbookmarked item via its own language usage", () => {
      const result = mediaItemsForBookmarks(
        [],
        lists,
        {
          languageUsageLanguages: ["lang1"],
        },
        "",
        {
          movie: {
            genreMoodIdsByOwner: {},
            placeTypeKeysByOwner: {},
            languageUsagesByOwner: {
              m1: [{
                languageId: "lang1",
                usageLevelId: "lvl1",
              }],
            },
          },
        },
      );
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["Inception", 0],
      ]);
    });

    it("still shows an actually-linked item alongside independent matches, with its real count", () => {
      const bookmarks = [makeBookmark({
        id: "b1",
        movieId: "m2",
      })];
      const result = mediaItemsForBookmarks(bookmarks, lists, {}, "inception");
      expect(result.map(item => [item.name, item.matchCount])).toEqual([
        ["The Matrix", 1],
        ["Inception", 0],
      ]);
    });

    it("excludes items that fail an active filter and have no matching bookmark", () => {
      const result = mediaItemsForBookmarks([], lists, {
        genreMoods: ["gm1"],
      });
      expect(result).toEqual([]);
    });
  });
});
