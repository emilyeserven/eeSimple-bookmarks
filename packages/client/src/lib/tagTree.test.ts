// @vitest-environment node
import type { TagNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { expandableIds, findAncestorPath, flattenTree, selectedSubtrees, subtreeIds } from "./tagTree";
import { makeTag as tagBase } from "../test-utils/factories";

function makeTag(id: string, slug: string, children: TagNode[] = []): TagNode {
  return {
    ...tagBase({
      id,
      name: id,
      slug,
    }),
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

describe("expandableIds", () => {
  it("collects only the ids of nodes that have children", () => {
    // a (b, d) and b (c) have children; c, d, e are leaves.
    expect(expandableIds(forest)).toEqual(["a", "b"]);
  });

  it("returns an empty list for a forest of leaves", () => {
    expect(expandableIds([d, e])).toEqual([]);
  });

  it("returns an empty list for an empty forest", () => {
    expect(expandableIds<TagNode>([])).toEqual([]);
  });
});

describe("selectedSubtrees", () => {
  it("keeps each selected node with its full subtree, dropping ancestors and siblings", () => {
    // Select b → keep b and its child c; a (ancestor) and d/e (siblings) are dropped.
    const result = selectedSubtrees(forest, new Set(["b"]));
    expect(result.map(n => n.id)).toEqual(["b"]);
    expect(result[0]).toBe(b);
  });

  it("returns a selected node's whole subtree (not just the node)", () => {
    const result = selectedSubtrees(forest, new Set(["a"]));
    expect(result.map(n => subtreeIds(n))).toEqual([["a", "b", "c", "d"]]);
  });

  it("finds deeper selections under unselected ancestors and supports multiple selections", () => {
    const result = selectedSubtrees(forest, new Set(["c", "e"]));
    expect(result.map(n => n.id)).toEqual(["c", "e"]);
  });

  it("returns an empty forest when nothing is selected", () => {
    expect(selectedSubtrees(forest, new Set())).toEqual([]);
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
