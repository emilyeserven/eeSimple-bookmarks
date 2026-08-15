// @vitest-environment node
import type { FilterContextData } from "../stores/uiStore";
import type { BookmarkSearch, TagNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { sameFilterContext } from "./useBookmarkSearchView";
import { makeCategory, makeTag } from "../test-utils/factories";

/**
 * The filter context is published from props that are referentially unstable by construction — the
 * listing routes pass `x ?? []` for ten taxonomy lists and an inline arrow for `onSearchChange` — so
 * this predicate is what keeps a listing re-render from rewriting the store (and re-rendering the
 * sort popover + CMD+K palette) for no reason.
 */
function makeContext(overrides: Partial<FilterContextData> = {}): FilterContextData {
  return {
    tree: [],
    properties: [],
    categories: [],
    mediaTypes: [],
    youtubeChannels: [],
    websites: [],
    relationshipTypes: [],
    people: [],
    placeTypes: [],
    genreMoods: [],
    bookmarks: [],
    search: {},
    onSearchChange: () => {
      // no-op: the predicate ignores the callback, which is published as a stable wrapper
    },
    ...overrides,
  };
}

function makeTagNode(): TagNode {
  return {
    ...makeTag(),
    children: [],
  };
}

describe("sameFilterContext", () => {
  it("treats the fresh empty arrays a loading listing hands over as unchanged", () => {
    // Every list here is a distinct `[]` instance, exactly as `x ?? []` produces each render.
    expect(sameFilterContext(makeContext(), makeContext())).toBe(true);
  });

  it("ignores the callback identity, since it is published as a stable wrapper", () => {
    expect(sameFilterContext(
      makeContext({
        onSearchChange: () => {
          // no-op
        },
      }),
      makeContext({
        onSearchChange: () => {
          // no-op
        },
      }),
    )).toBe(true);
  });

  it("keeps a loaded list stable across renders by identity", () => {
    const categories = [makeCategory()];
    expect(sameFilterContext(
      makeContext({
        categories,
      }),
      makeContext({
        categories,
      }),
    )).toBe(true);
  });

  it("republishes when a list's contents arrive or change", () => {
    const loaded = makeContext({
      categories: [makeCategory()],
    });
    expect(sameFilterContext(makeContext(), loaded)).toBe(false);
    expect(sameFilterContext(loaded, makeContext({
      categories: [makeCategory()],
    }))).toBe(false);
    expect(sameFilterContext(makeContext(), makeContext({
      tree: [makeTagNode()],
    }))).toBe(false);
  });

  it("republishes when the search changes, by identity or by value", () => {
    const search: BookmarkSearch = {
      tagPresence: "has",
    };
    expect(sameFilterContext(makeContext({
      search,
    }), makeContext({
      search,
    }))).toBe(true);
    // A route that rebuilds the object still compares equal while the values match…
    expect(sameFilterContext(makeContext({
      search: {
        tagPresence: "has",
      },
    }), makeContext({
      search: {
        tagPresence: "has",
      },
    }))).toBe(true);
    // …and a real change republishes.
    expect(sameFilterContext(makeContext({
      search,
    }), makeContext({
      search: {
        tagPresence: "missing",
      },
    }))).toBe(false);
  });
});
