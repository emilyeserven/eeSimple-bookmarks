// @vitest-environment node
import type { LocationNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildFocusedMapTree, pruneHiddenSubtrees } from "./locationMainMap";
import { flattenTree } from "./tagTree";
import { makeLocation } from "../test-utils/factories";

/** Build a `LocationNode` from an id (+ optional children + overrides), threading `parentId`. */
function node(id: string, children: LocationNode[] = [], overrides: Partial<LocationNode> = {}): LocationNode {
  const self: LocationNode = {
    ...makeLocation({
      id,
      slug: id,
      name: id,
      ...overrides,
    }),
    children,
  };
  for (const child of children) child.parentId = id;
  return self;
}

/**
 * japan → honshu → chugoku → yamaguchi → hagi, a separate root kyushu, and a hidden usa → california.
 */
function fixture(): LocationNode[] {
  return [
    node("japan", [
      node("honshu", [
        node("chugoku", [
          node("yamaguchi", [node("hagi")]),
        ]),
      ]),
    ]),
    node("kyushu"),
    node("usa", [node("california", [node("losangeles")])], {
      hiddenOnMainMap: true,
    }),
  ];
}

/** Sorted plotted ids across a tree, for order-independent assertions. */
function ids(tree: LocationNode[]): string[] {
  return flattenTree(tree).map(({
    node: n,
  }) => n.id).sort();
}

describe("pruneHiddenSubtrees", () => {
  it("drops a hidden node and its whole subtree", () => {
    expect(ids(pruneHiddenSubtrees(fixture()))).toEqual(
      ["chugoku", "hagi", "honshu", "japan", "kyushu", "yamaguchi"],
    );
  });

  it("leaves a tree with no hidden nodes untouched", () => {
    const tree = [node("a", [node("b")])];
    expect(ids(pruneHiddenSubtrees(tree))).toEqual(["a", "b"]);
  });
});

describe("buildFocusedMapTree", () => {
  it("returns the hidden-pruned tree when no row is focused", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      chainFocusIds: [],
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "honshu", "japan", "kyushu", "yamaguchi"]);
  });

  it("item focus plots the node + its descendants, not its ancestors", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["chugoku"],
      chainFocusIds: [],
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "yamaguchi"]);
    // chugoku is promoted to a root (its dropped parent honshu is not plotted).
    expect(result.map(n => n.id)).toEqual(["chugoku"]);
  });

  it("chain focus additionally plots the node's ancestor spine (siblings excluded)", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      chainFocusIds: ["chugoku"],
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "honshu", "japan", "yamaguchi"]);
    // The spine stays nested under its real root, kyushu is excluded.
    expect(result.map(n => n.id)).toEqual(["japan"]);
    expect(result[0]?.children.map(n => n.id)).toEqual(["honshu"]);
  });

  it("unions item and chain focuses across rows", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["chugoku"],
      chainFocusIds: ["kyushu"],
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "kyushu", "yamaguchi"]);
  });

  it("keeps a focused-but-hidden location off the map (hidden wins)", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      chainFocusIds: ["california"],
    });
    expect(ids(result)).toEqual([]);
  });

  it("ignores stale ids not present in the tree", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["ghost"],
      chainFocusIds: [],
    });
    expect(ids(result)).toEqual([]);
  });
});
