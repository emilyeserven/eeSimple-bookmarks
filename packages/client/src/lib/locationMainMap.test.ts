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
 * japan → honshu → chugoku → yamaguchi → hagi, a separate root kyushu, and a flag-hidden usa → california.
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
  it("drops a flag-hidden node and its whole subtree (default predicate)", () => {
    expect(ids(pruneHiddenSubtrees(fixture()))).toEqual(
      ["chugoku", "hagi", "honshu", "japan", "kyushu", "yamaguchi"],
    );
  });

  it("honours a custom predicate (e.g. session ids), ignoring the flag", () => {
    const hidden = new Set(["honshu"]);
    // usa is flag-hidden but the custom predicate doesn't hide it, so it stays; honshu's subtree drops.
    expect(ids(pruneHiddenSubtrees(fixture(), n => hidden.has(n.id)))).toEqual(
      ["california", "japan", "kyushu", "losangeles", "usa"],
    );
  });
});

describe("buildFocusedMapTree", () => {
  it("returns the hidden-pruned tree when no row is focused", () => {
    const hiddenIds = new Set(["usa", "california", "losangeles"]);
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      hiddenIds,
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "honshu", "japan", "kyushu", "yamaguchi"]);
  });

  it("session hiddenIds can show a flag-hidden node (override absent from the set)", () => {
    // usa is flag-hidden, but the session set is empty → nothing hidden, usa shows.
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      hiddenIds: new Set(),
    });
    expect(ids(result)).toContain("usa");
    expect(ids(result)).toContain("california");
  });

  it("session hiddenIds can hide a flag-visible node (override present in the set)", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      hiddenIds: new Set(["kyushu"]),
    });
    expect(ids(result)).not.toContain("kyushu");
  });

  it("hiding a node drops its whole subtree", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: [],
      hiddenIds: new Set(["honshu"]),
    });
    expect(ids(result).filter(id => ["honshu", "chugoku", "yamaguchi", "hagi"].includes(id))).toEqual([]);
    expect(ids(result)).toContain("japan");
  });

  it("item focus plots the node + its descendants, not its ancestors", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["chugoku"],
      hiddenIds: new Set(),
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "yamaguchi"]);
    // chugoku is promoted to a root (its dropped parent honshu is not plotted).
    expect(result.map(n => n.id)).toEqual(["chugoku"]);
  });

  it("unions item focuses across rows", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["chugoku", "kyushu"],
      hiddenIds: new Set(),
    });
    expect(ids(result)).toEqual(["chugoku", "hagi", "kyushu", "yamaguchi"]);
  });

  it("keeps a focused-but-hidden location off the map (hidden wins)", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["kyushu"],
      hiddenIds: new Set(["kyushu"]),
    });
    expect(ids(result)).toEqual([]);
  });

  it("ignores stale focus ids not present in the tree", () => {
    const result = buildFocusedMapTree(fixture(), {
      itemFocusIds: ["ghost"],
      hiddenIds: new Set(),
    });
    expect(ids(result)).toEqual([]);
  });
});
