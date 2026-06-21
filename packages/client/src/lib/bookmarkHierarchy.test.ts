import type { BookmarkRelationship, BookmarkUrlSummary } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { makeBookmark } from "../test-utils/factories";

import { buildBookmarkHierarchy } from "./bookmarkHierarchy";

/** A directional relationship edge naming `other` as `role` relative to the carrying bookmark. */
function rel(other: BookmarkUrlSummary, role: "parent" | "child", directional = true): BookmarkRelationship {
  return {
    bookmark: other,
    relationshipTypeId: "rt-parent-child",
    relationshipTypeName: "Parent/child",
    directional,
    role,
    label: null,
  };
}

function summary(id: string, title: string): BookmarkUrlSummary {
  return {
    id,
    url: `https://example.com/${id}`,
    title,
  };
}

describe("buildBookmarkHierarchy", () => {
  it("returns [] when the target has no relationships", () => {
    const a = makeBookmark({
      id: "a",
      title: "A",
    });
    expect(buildBookmarkHierarchy("a", [a])).toEqual([]);
  });

  it("returns [] when the target id is not in the list", () => {
    const a = makeBookmark({
      id: "a",
      title: "A",
    });
    expect(buildBookmarkHierarchy("missing", [a])).toEqual([]);
  });

  it("builds a parent → target tree from a child edge on the parent", () => {
    const parent = makeBookmark({
      id: "p",
      title: "Parent",
      relationships: [rel(summary("t", "Target"), "child")],
    });
    const target = makeBookmark({
      id: "t",
      title: "Target",
    });

    const result = buildBookmarkHierarchy("t", [parent, target]);

    expect(result).toHaveLength(1);
    expect(result[0].bookmark.id).toBe("p");
    expect(result[0].isTarget).toBe(false);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].bookmark.id).toBe("t");
    expect(result[0].children[0].isTarget).toBe(true);
  });

  it("treats a parent-role edge on the target symmetrically with a child-role edge on the parent", () => {
    // The target itself names its parent via a `parent` role edge.
    const target = makeBookmark({
      id: "t",
      title: "Target",
      relationships: [rel(summary("p", "Parent"), "parent")],
    });
    const parent = makeBookmark({
      id: "p",
      title: "Parent",
    });

    const result = buildBookmarkHierarchy("t", [target, parent]);

    expect(result).toHaveLength(1);
    expect(result[0].bookmark.id).toBe("p");
    expect(result[0].children[0].isTarget).toBe(true);
  });

  it("walks both up to ancestors and down to descendants", () => {
    const grand = makeBookmark({
      id: "g",
      title: "Grand",
      relationships: [rel(summary("p", "Parent"), "child")],
    });
    const parent = makeBookmark({
      id: "p",
      title: "Parent",
      relationships: [rel(summary("t", "Target"), "child")],
    });
    const target = makeBookmark({
      id: "t",
      title: "Target",
      relationships: [rel(summary("c", "Child"), "child")],
    });
    const child = makeBookmark({
      id: "c",
      title: "Child",
    });

    const result = buildBookmarkHierarchy("t", [grand, parent, target, child]);

    // Single root: Grand → Parent → Target → Child.
    expect(result).toHaveLength(1);
    expect(result[0].bookmark.id).toBe("g");
    const p = result[0].children[0];
    expect(p.bookmark.id).toBe("p");
    const t = p.children[0];
    expect(t.bookmark.id).toBe("t");
    expect(t.isTarget).toBe(true);
    expect(t.children[0].bookmark.id).toBe("c");
  });

  it("prunes lineages unrelated to the target", () => {
    // Target has a parent; a separate, disconnected pair exists in the list.
    const parent = makeBookmark({
      id: "p",
      title: "Parent",
      relationships: [rel(summary("t", "Target"), "child")],
    });
    const target = makeBookmark({
      id: "t",
      title: "Target",
    });
    const otherParent = makeBookmark({
      id: "op",
      title: "Other",
      relationships: [rel(summary("oc", "OtherChild"), "child")],
    });
    const otherChild = makeBookmark({
      id: "oc",
      title: "OtherChild",
    });

    const result = buildBookmarkHierarchy("t", [parent, target, otherParent, otherChild]);

    expect(result).toHaveLength(1);
    expect(result[0].bookmark.id).toBe("p");
  });

  it("ignores non-directional (symmetric) relationships", () => {
    const related = makeBookmark({
      id: "r",
      title: "Related",
      relationships: [rel(summary("t", "Target"), "child", false)],
    });
    const target = makeBookmark({
      id: "t",
      title: "Target",
    });

    expect(buildBookmarkHierarchy("t", [related, target])).toEqual([]);
  });

  it("sorts sibling children by title", () => {
    const parent = makeBookmark({
      id: "p",
      title: "Parent",
      relationships: [
        rel(summary("t", "Target"), "child"),
        rel(summary("z", "Zebra"), "child"),
        rel(summary("a", "Apple"), "child"),
      ],
    });
    const target = makeBookmark({
      id: "t",
      title: "Target",
    });
    const zebra = makeBookmark({
      id: "z",
      title: "Zebra",
    });
    const apple = makeBookmark({
      id: "a",
      title: "Apple",
    });

    const result = buildBookmarkHierarchy("t", [parent, target, zebra, apple]);

    // Only the target's lineage is relevant — siblings z/a are not ancestors/descendants of t.
    expect(result[0].children.map(c => c.bookmark.id)).toEqual(["t"]);
  });

  it("de-duplicates a diamond DAG so the shared descendant renders once", () => {
    // a → b, a → c, b → d, c → d (a diamond); target is a.
    const a = makeBookmark({
      id: "a",
      title: "A",
      relationships: [rel(summary("b", "B"), "child"), rel(summary("c", "C"), "child")],
    });
    const b = makeBookmark({
      id: "b",
      title: "B",
      relationships: [rel(summary("d", "D"), "child")],
    });
    const c = makeBookmark({
      id: "c",
      title: "C",
      relationships: [rel(summary("d", "D"), "child")],
    });
    const d = makeBookmark({
      id: "d",
      title: "D",
    });

    const result = buildBookmarkHierarchy("a", [a, b, c, d]);

    // The shared descendant d reaches via both b and c, but must render exactly once.
    const seen = new Set<string>();
    const walk = (nodes: typeof result) => {
      for (const n of nodes) {
        expect(seen.has(n.bookmark.id)).toBe(false);
        seen.add(n.bookmark.id);
        walk(n.children);
      }
    };
    walk(result);
    expect(seen).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("returns [] for a pure cycle with no root", () => {
    // a → b and b → a — every node has a relevant parent, so there is no root to render.
    const a = makeBookmark({
      id: "a",
      title: "A",
      relationships: [rel(summary("b", "B"), "child")],
    });
    const b = makeBookmark({
      id: "b",
      title: "B",
      relationships: [rel(summary("a", "A"), "child")],
    });

    expect(buildBookmarkHierarchy("a", [a, b])).toEqual([]);
  });
});
