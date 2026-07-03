// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildMediaTypeTree } from "./mediaTypeTree";

import { makeMediaType } from "@/test-utils/factories";

describe("buildMediaTypeTree", () => {
  it("nests children under their parent by parentId", () => {
    const flat = [
      makeMediaType({
        id: "video",
        name: "Video",
      }),
      makeMediaType({
        id: "film",
        name: "Film",
        parentId: "video",
      }),
    ];

    const tree = buildMediaTypeTree(flat);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe("video");
    expect(tree[0]?.children.map(c => c.id)).toEqual(["film"]);
  });

  it("orders siblings by sortOrder at every level", () => {
    const flat = [
      makeMediaType({
        id: "b",
        name: "B",
        sortOrder: 2,
      }),
      makeMediaType({
        id: "a",
        name: "A",
        sortOrder: 1,
      }),
      makeMediaType({
        id: "a2",
        name: "A2",
        parentId: "a",
        sortOrder: 2,
      }),
      makeMediaType({
        id: "a1",
        name: "A1",
        parentId: "a",
        sortOrder: 1,
      }),
    ];

    const tree = buildMediaTypeTree(flat);
    expect(tree.map(n => n.id)).toEqual(["a", "b"]);
    expect(tree[0]?.children.map(n => n.id)).toEqual(["a1", "a2"]);
  });

  it("handles more than two levels of nesting", () => {
    const flat = [
      makeMediaType({
        id: "l1",
        name: "L1",
      }),
      makeMediaType({
        id: "l2",
        name: "L2",
        parentId: "l1",
      }),
      makeMediaType({
        id: "l3",
        name: "L3",
        parentId: "l2",
      }),
    ];

    const tree = buildMediaTypeTree(flat);
    expect(tree[0]?.children[0]?.children[0]?.id).toBe("l3");
  });

  it("returns an empty tree for no rows", () => {
    expect(buildMediaTypeTree([])).toEqual([]);
  });
});
