// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  AI_TARGET_SOFT_WARNING_THRESHOLD,
  EMPTY_AI_BOOKMARK_TARGET_SELECTION,
  resolveBookmarkTargets,
} from "./aiBookmarkTargets";
import { makeBookmark } from "../test-utils/factories";

import type { AiBookmarkTargetSelection } from "./aiBookmarkTargets";
import type { SavedFilter } from "@eesimple/types";

function selection(overrides: Partial<AiBookmarkTargetSelection>): AiBookmarkTargetSelection {
  return {
    ...EMPTY_AI_BOOKMARK_TARGET_SELECTION,
    ...overrides,
  };
}

const bmTag = (id: string, name: string) => ({
  id,
  name,
  slug: name,
  parentId: null,
  editableOnCard: false,
});

function savedFilter(id: string, filters: Record<string, unknown>): SavedFilter {
  return {
    id,
    name: `Filter ${id}`,
    slug: id,
    description: null,
    filters,
    viewableOnline: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("resolveBookmarkTargets", () => {
  const bookmarks = [
    makeBookmark({
      id: "b1",
      categoryId: "cat-1",
    }),
    makeBookmark({
      id: "b2",
      categoryId: "cat-2",
      tags: [bmTag("t-child", "child")],
    }),
    makeBookmark({
      id: "b3",
      categoryId: "cat-2",
      website: {
        id: "w1",
        domain: "example.com",
        siteName: "Example",
        slug: "example",
      },
    }),
  ];

  it("matches nothing for an empty selection", () => {
    expect(resolveBookmarkTargets(bookmarks, EMPTY_AI_BOOKMARK_TARGET_SELECTION)).toEqual([]);
  });

  it("unions individual picks with group matches, deduped in stable order", () => {
    const targets = resolveBookmarkTargets(bookmarks, selection({
      bookmarkIds: ["b3"],
      categoryIds: ["cat-1"],
    }));
    expect(targets.map(bookmark => bookmark.id)).toEqual(["b1", "b3"]);
  });

  it("does not double-count a bookmark matching several groups", () => {
    const targets = resolveBookmarkTargets(bookmarks, selection({
      bookmarkIds: ["b3"],
      categoryIds: ["cat-2"],
      websiteIds: ["w1"],
    }));
    expect(targets.map(bookmark => bookmark.id)).toEqual(["b2", "b3"]);
  });

  it("expands a selected tag to its subtree when the tree is provided", () => {
    const tagTree = [{
      id: "t-parent",
      children: [{
        id: "t-child",
        children: [],
      }],
    }];
    expect(resolveBookmarkTargets(bookmarks, selection({
      tagIds: ["t-parent"],
    }), {
      tagTree,
    }).map(bookmark => bookmark.id)).toEqual(["b2"]);
    // Without the tree, only exact-id matches apply.
    expect(resolveBookmarkTargets(bookmarks, selection({
      tagIds: ["t-parent"],
    }))).toEqual([]);
  });

  it("matches every bookmark a selected saved filter's search matches", () => {
    const filters = [savedFilter("f1", {
      categories: ["cat-2"],
    })];
    expect(resolveBookmarkTargets(bookmarks, selection({
      savedFilterIds: ["f1"],
    }), {}, filters).map(bookmark => bookmark.id)).toEqual(["b2", "b3"]);
  });

  it("unions several saved filters and dedupes against the other pickers", () => {
    const filters = [
      savedFilter("f1", {
        categories: ["cat-1"],
      }),
      savedFilter("f2", {
        websites: ["w1"],
      }),
    ];
    expect(resolveBookmarkTargets(bookmarks, selection({
      bookmarkIds: ["b3"],
      savedFilterIds: ["f1", "f2"],
    }), {}, filters).map(bookmark => bookmark.id)).toEqual(["b1", "b3"]);
  });

  it("ignores a selected filter id that no longer resolves", () => {
    expect(resolveBookmarkTargets(bookmarks, selection({
      savedFilterIds: ["gone"],
    }), {}, [])).toEqual([]);
  });

  it("exposes a soft warning threshold for the targets card", () => {
    expect(AI_TARGET_SOFT_WARNING_THRESHOLD).toBeGreaterThan(0);
  });
});
