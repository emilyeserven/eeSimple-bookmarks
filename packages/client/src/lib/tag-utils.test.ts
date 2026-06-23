import type { TagNode } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { rootOnly, toggleId } from "./tag-utils";

function node(id: string, children: TagNode[] = []): TagNode {
  return {
    id,
    name: id,
    slug: id,
    parentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    children,
  };
}

describe("rootOnly", () => {
  it("strips children from every root node", () => {
    const tree = [node("a", [node("a1")]), node("b", [node("b1"), node("b2")])];
    const result = rootOnly(tree);
    expect(result).toHaveLength(2);
    expect(result.every(n => n.children.length === 0)).toBe(true);
  });

  it("preserves the root nodes' own data", () => {
    expect(rootOnly([node("a", [node("a1")])])[0].id).toBe("a");
  });

  it("returns an empty array for an empty tree", () => {
    expect(rootOnly([])).toEqual([]);
  });
});

describe("toggleId", () => {
  it("adds an id that is absent", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an id that is present", () => {
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("does not mutate the input array", () => {
    const ids = ["a"];
    toggleId(ids, "b");
    expect(ids).toEqual(["a"]);
  });
});
