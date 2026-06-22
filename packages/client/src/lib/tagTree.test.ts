import type { TagNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { findAncestorPath, flattenTree, subtreeIds } from "./tagTree";

function makeTag(id: string, slug: string, children: TagNode[] = []): TagNode {
  return {
    id,
    name: id,
    slug,
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    children,
  };
}

// a -> b -> c, a -> d  (two roots: a and e)
const c = makeTag("c", "c-slug");
const b = makeTag("b", "b-slug", [c]);
const d = makeTag("d", "d-slug");
const a = makeTag("a", "a-slug", [b, d]);
const e = makeTag("e", "e-slug");
const forest: TagNode[] = [a, e];

describe("flattenTree", () => {
  it("flattens depth-first carrying each node's depth", () => {
    const flat = flattenTree(forest);
    expect(flat.map(f => [f.node.id, f.depth])).toEqual([
      ["a", 0],
      ["b", 1],
      ["c", 2],
      ["d", 1],
      ["e", 0],
    ]);
  });

  it("returns an empty list for an empty forest", () => {
    expect(flattenTree<TagNode>([])).toEqual([]);
  });

  it("honors a non-zero starting depth", () => {
    expect(flattenTree([e], 3)).toEqual([{
      node: e,
      depth: 3,
    }]);
  });
});

describe("subtreeIds", () => {
  it("collects the node and all descendant ids inclusively", () => {
    expect(subtreeIds(a)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns just the id for a leaf node", () => {
    expect(subtreeIds(e)).toEqual(["e"]);
  });
});

describe("findAncestorPath", () => {
  it("returns the ordered path from root ancestor to the target", () => {
    expect(findAncestorPath(forest, "c-slug")?.map(n => n.id)).toEqual(["a", "b", "c"]);
  });

  it("returns a single-element path for a root match", () => {
    expect(findAncestorPath(forest, "e-slug")?.map(n => n.id)).toEqual(["e"]);
  });

  it("returns null when the slug is absent", () => {
    expect(findAncestorPath(forest, "missing")).toBeNull();
  });
});
