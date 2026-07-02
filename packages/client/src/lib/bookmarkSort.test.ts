// @vitest-environment node
import type { BookmarkSort } from "./bookmarkSort";

import { describe, expect, it } from "vitest";

import { makeBookmark, makeCustomProperty } from "@/test-utils/factories";

import { sortBookmarks } from "./bookmarkSort";

const asc = (field: string): BookmarkSort => ({
  primary: {
    field,
    direction: "asc",
  },
});
const desc = (field: string): BookmarkSort => ({
  primary: {
    field,
    direction: "desc",
  },
});

/** Returns the ids of the sorted result in order. */
function order(
  bookmarks: ReturnType<typeof makeBookmark>[],
  sort: BookmarkSort | undefined,
  props: ReturnType<typeof makeCustomProperty>[] = [],
): string[] {
  return sortBookmarks(bookmarks, sort, props).map(b => b.id);
}

describe("sortBookmarks", () => {
  it("returns the original array untouched when sort is undefined", () => {
    const list = [makeBookmark({
      id: "b",
    }), makeBookmark({
      id: "a",
    })];
    const result = sortBookmarks(list, undefined, []);
    expect(result).toBe(list);
    expect(result.map(b => b.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const list = [makeBookmark({
      id: "b",
      title: "B",
    }), makeBookmark({
      id: "a",
      title: "A",
    })];
    sortBookmarks(list, asc("title"), []);
    expect(list.map(b => b.id)).toEqual(["b", "a"]);
  });

  describe("built-in fields", () => {
    it("sorts by title case-insensitively, ascending and descending", () => {
      const list = [
        makeBookmark({
          id: "c",
          title: "cherry",
        }),
        makeBookmark({
          id: "a",
          title: "Apple",
        }),
        makeBookmark({
          id: "b",
          title: "banana",
        }),
      ];
      expect(order(list, asc("title"))).toEqual(["a", "b", "c"]);
      expect(order(list, desc("title"))).toEqual(["c", "b", "a"]);
    });

    it("sorts by createdAt", () => {
      const list = [
        makeBookmark({
          id: "new",
          createdAt: "2024-03-01T00:00:00.000Z",
        }),
        makeBookmark({
          id: "old",
          createdAt: "2024-01-01T00:00:00.000Z",
        }),
      ];
      expect(order(list, asc("createdAt"))).toEqual(["old", "new"]);
      expect(order(list, desc("createdAt"))).toEqual(["new", "old"]);
    });

    it("sorts updatedAt with null (never-updated) always last, regardless of direction", () => {
      const list = [
        makeBookmark({
          id: "never",
          updatedAt: null,
        }),
        makeBookmark({
          id: "recent",
          updatedAt: "2024-05-01T00:00:00.000Z",
        }),
        makeBookmark({
          id: "older",
          updatedAt: "2024-02-01T00:00:00.000Z",
        }),
      ];
      expect(order(list, asc("updatedAt"))).toEqual(["older", "recent", "never"]);
      expect(order(list, desc("updatedAt"))).toEqual(["recent", "older", "never"]);
    });

    it("treats two never-updated bookmarks as equal", () => {
      const list = [
        makeBookmark({
          id: "x",
          updatedAt: null,
        }),
        makeBookmark({
          id: "y",
          updatedAt: null,
        }),
      ];
      expect(order(list, asc("updatedAt"))).toEqual(["x", "y"]);
    });
  });

  describe("custom property fields", () => {
    it("returns original order when the property id is unknown", () => {
      const list = [makeBookmark({
        id: "b",
      }), makeBookmark({
        id: "a",
      })];
      expect(order(list, asc("missing-prop"), [])).toEqual(["b", "a"]);
    });

    it("sorts numeric properties with missing values last (both directions)", () => {
      const prop = makeCustomProperty({
        id: "rating",
        type: "number",
      });
      const list = [
        makeBookmark({
          id: "none",
          numberValues: [],
        }),
        makeBookmark({
          id: "hi",
          numberValues: [{
            propertyId: "rating",
            value: 9,
          }],
        }),
        makeBookmark({
          id: "lo",
          numberValues: [{
            propertyId: "rating",
            value: 3,
          }],
        }),
      ];
      expect(order(list, asc("rating"), [prop])).toEqual(["lo", "hi", "none"]);
      expect(order(list, desc("rating"), [prop])).toEqual(["hi", "lo", "none"]);
    });

    it.each(["calculate", "ratingScale"] as const)("sorts %s properties numerically", (type) => {
      const prop = makeCustomProperty({
        id: "p",
        type,
      });
      const list = [
        makeBookmark({
          id: "hi",
          numberValues: [{
            propertyId: "p",
            value: 5,
          }],
        }),
        makeBookmark({
          id: "lo",
          numberValues: [{
            propertyId: "p",
            value: 1,
          }],
        }),
      ];
      expect(order(list, asc("p"), [prop])).toEqual(["lo", "hi"]);
    });

    it("sorts datetime properties chronologically with missing last", () => {
      const prop = makeCustomProperty({
        id: "due",
        type: "datetime",
      });
      const list = [
        makeBookmark({
          id: "none",
          dateTimeValues: [],
        }),
        makeBookmark({
          id: "late",
          dateTimeValues: [{
            propertyId: "due",
            value: "2024-12-01T00:00:00.000Z",
          }],
        }),
        makeBookmark({
          id: "early",
          dateTimeValues: [{
            propertyId: "due",
            value: "2024-01-01T00:00:00.000Z",
          }],
        }),
      ];
      expect(order(list, asc("due"), [prop])).toEqual(["early", "late", "none"]);
    });

    it("sorts text properties case-insensitively with missing last", () => {
      const prop = makeCustomProperty({
        id: "note",
        type: "text",
      });
      const list = [
        makeBookmark({
          id: "none",
          textValues: [],
        }),
        makeBookmark({
          id: "z",
          textValues: [{
            propertyId: "note",
            value: "Zebra",
          }],
        }),
        makeBookmark({
          id: "a",
          textValues: [{
            propertyId: "note",
            value: "apple",
          }],
        }),
      ];
      expect(order(list, asc("note"), [prop])).toEqual(["a", "z", "none"]);
    });

    it("sorts boolean properties false before true, missing last", () => {
      const prop = makeCustomProperty({
        id: "done",
        type: "boolean",
      });
      const list = [
        makeBookmark({
          id: "none",
          booleanValues: [],
        }),
        makeBookmark({
          id: "yes",
          booleanValues: [{
            propertyId: "done",
            value: true,
          }],
        }),
        makeBookmark({
          id: "no",
          booleanValues: [{
            propertyId: "done",
            value: false,
          }],
        }),
      ];
      expect(order(list, asc("done"), [prop])).toEqual(["no", "yes", "none"]);
      expect(order(list, desc("done"), [prop])).toEqual(["yes", "no", "none"]);
    });

    it("sorts choices properties by the first choice's label, falling back to its raw value", () => {
      const prop = makeCustomProperty({
        id: "status",
        type: "choices",
        choicesItems: [
          {
            label: "Archived",
            value: "arch",
          },
          {
            label: "Backlog",
            value: "back",
          },
        ],
      });
      const list = [
        makeBookmark({
          id: "none",
          choicesValues: [],
        }),
        makeBookmark({
          id: "raw",
          choicesValues: [{
            propertyId: "status",
            values: ["zzz-unknown"],
          }],
        }),
        makeBookmark({
          id: "back",
          choicesValues: [{
            propertyId: "status",
            values: ["back"],
          }],
        }),
        makeBookmark({
          id: "arch",
          choicesValues: [{
            propertyId: "status",
            values: ["arch"],
          }],
        }),
      ];
      // Labels: "Archived" < "Backlog" < "zzz-unknown" (raw fallback), missing last.
      expect(order(list, asc("status"), [prop])).toEqual(["arch", "back", "raw", "none"]);
    });

    it("treats a choices value with an empty selection as missing", () => {
      const prop = makeCustomProperty({
        id: "status",
        type: "choices",
        choicesItems: [],
      });
      const list = [
        makeBookmark({
          id: "empty",
          choicesValues: [{
            propertyId: "status",
            values: [],
          }],
        }),
        makeBookmark({
          id: "set",
          choicesValues: [{
            propertyId: "status",
            values: ["x"],
          }],
        }),
      ];
      expect(order(list, asc("status"), [prop])).toEqual(["set", "empty"]);
    });

    it("returns 0 (stable) for an unsortable property type", () => {
      const prop = makeCustomProperty({
        id: "file",
        type: "file",
      });
      const list = [makeBookmark({
        id: "b",
      }), makeBookmark({
        id: "a",
      })];
      expect(order(list, asc("file"), [prop])).toEqual(["b", "a"]);
    });
  });

  describe("secondary dimension", () => {
    it("breaks primary ties with the secondary dimension", () => {
      const list = [
        makeBookmark({
          id: "cat-a-z",
          title: "Zzz",
          categoryId: "a",
        }),
        makeBookmark({
          id: "cat-a-a",
          title: "Aaa",
          categoryId: "a",
        }),
      ];
      const sort: BookmarkSort = {
        primary: {
          field: "createdAt",
          direction: "asc",
        }, // equal NOW → tie
        secondary: {
          field: "title",
          direction: "asc",
        },
      };
      expect(order(list, sort)).toEqual(["cat-a-a", "cat-a-z"]);
    });
  });

  describe("random sort", () => {
    it("is deterministic for a given seed and re-orders by id hash", () => {
      const list = [
        makeBookmark({
          id: "alpha",
        }),
        makeBookmark({
          id: "bravo",
        }),
        makeBookmark({
          id: "charlie",
        }),
      ];
      const first = order(list, {
        random: true,
        seed: 42,
      });
      const second = order(list, {
        random: true,
        seed: 42,
      });
      expect(first).toEqual(second);
      expect(first.slice().sort()).toEqual(["alpha", "bravo", "charlie"]);
    });

    it("can produce a different order for a different seed", () => {
      const list = Array.from({
        length: 8,
      }, (_, i) => makeBookmark({
        id: `id-${i}`,
      }));
      const a = order(list, {
        random: true,
        seed: 1,
      });
      const b = order(list, {
        random: true,
        seed: 999,
      });
      expect(a).not.toEqual(b);
    });
  });
});
