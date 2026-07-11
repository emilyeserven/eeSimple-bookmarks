// @vitest-environment node
import type { Bookmark, BookmarkGraphSettings, BookmarkRelationship, BookmarkTag } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  buildBookmarkGraph,
  edgeOpacity,
  edgeStrokeWidth,
  neighborsOf,
  nodeOpacityForDistance,
  nodeRadius,
  truncateLabel,
} from "./bookmarkGraph";
import { makeBookmark } from "../test-utils/factories";

const tag = (id: string): BookmarkTag => ({
  id,
  slug: id,
  name: id,
  parentId: null,
  editableOnCard: false,
});

const rel = (partner: Bookmark): BookmarkRelationship => ({
  relationshipTypeId: "rt1",
  relationshipTypeName: "Similar",
  directional: false,
  role: "related",
  label: null,
  bookmark: {
    id: partner.id,
    title: partner.title,
    url: partner.url,
  },
});

/** Settings scoring tags only (weight 3), with every other weight off. */
const TAGS_ONLY: BookmarkGraphSettings = {
  weights: {
    tags: 3,
    category: 0,
    mediaType: 0,
    genreMoods: 0,
    people: 0,
    groups: 0,
    website: 0,
    youtubeChannel: 0,
  },
  maxRelated: 12,
};

const ALL_OFF: BookmarkGraphSettings = {
  weights: {
    ...TAGS_ONLY.weights,
    tags: 0,
  },
  maxRelated: 12,
};

/** The kept edge between two ids (order-independent), or undefined. */
function edgeBetween(graph: ReturnType<typeof buildBookmarkGraph>, a: string, b: string) {
  return graph.edges.find(edge =>
    (edge.sourceId === a && edge.targetId === b) || (edge.sourceId === b && edge.targetId === a));
}

/** Node id → BFS distance, for asserting layering. */
function distanceMap(graph: ReturnType<typeof buildBookmarkGraph>): Map<string, number> {
  return new Map(graph.nodes.map(node => [node.bookmark.id, node.distance]));
}

describe("buildBookmarkGraph", () => {
  it("displays exactly the center plus the related set, with the center flagged", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const related = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const unrelated = makeBookmark({
      id: "c",
      tags: [tag("z")],
    });
    const graph = buildBookmarkGraph(target, [target, related, unrelated], TAGS_ONLY);
    expect(graph.nodes.map(node => node.bookmark.id)).toEqual(["a", "b"]);
    expect(graph.nodes.map(node => node.isCenter)).toEqual([true, false]);
  });

  it("draws no edge between displayed bookmarks that share nothing weighted", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x"), tag("y")],
    });
    const viaX = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const viaY = makeBookmark({
      id: "c",
      tags: [tag("y")],
    });
    const graph = buildBookmarkGraph(target, [target, viaX, viaY], TAGS_ONLY);
    expect(edgeBetween(graph, "a", "b")?.score).toBe(3);
    expect(edgeBetween(graph, "a", "c")?.score).toBe(3);
    expect(edgeBetween(graph, "b", "c")).toBeUndefined();
  });

  it("keeps an explicit relationship edge with its score floored to 1 even with every weight off", () => {
    const partner = makeBookmark({
      id: "b",
    });
    const target = makeBookmark({
      id: "a",
      relationships: [rel(partner)],
    });
    const graph = buildBookmarkGraph(target, [target, partner], ALL_OFF);
    expect(graph.nodes.map(node => node.bookmark.id)).toEqual(["a", "b"]);
    expect(graph.edges).toEqual([{
      sourceId: "a",
      targetId: "b",
      score: 1,
      explicit: true,
    }]);
  });

  it("detects a peer↔peer explicit edge from either hydrated side and dedupes it to one", () => {
    const peerA = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const peerB = makeBookmark({
      id: "c",
      tags: [tag("x")],
      // Only this side carries the relationship row — the other side must still see the edge.
      relationships: [rel(peerA)],
    });
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const graph = buildBookmarkGraph(target, [target, peerA, peerB], TAGS_ONLY);
    const peerEdges = graph.edges.filter(edge =>
      (edge.sourceId === "b" && edge.targetId === "c") || (edge.sourceId === "c" && edge.targetId === "b"));
    expect(peerEdges).toHaveLength(1);
    expect(peerEdges[0].explicit).toBe(true);

    const bothSides = buildBookmarkGraph(target, [
      target,
      makeBookmark({
        ...peerA,
        relationships: [rel(peerB)],
      }),
      peerB,
    ], TAGS_ONLY);
    expect(bothSides.edges.filter(edge => edge.explicit)).toHaveLength(1);
  });

  it("prunes a peer↔peer edge outside both endpoints' strongest few, keeping center + explicit edges", () => {
    // Two "hub" peers each strongly tied to their own four satellites; the weak hub↔hub edge ranks
    // 5th on both hubs and is pruned, while the even weaker explicit center spokes all survive.
    const hubA = makeBookmark({
      id: "hubA",
      tags: [tag("ab"), tag("a1"), tag("a1b"), tag("a2"), tag("a2b"), tag("a3"), tag("a3b"), tag("a4"), tag("a4b")],
    });
    const hubB = makeBookmark({
      id: "hubB",
      tags: [tag("ab"), tag("b1"), tag("b1b"), tag("b2"), tag("b2b"), tag("b3"), tag("b3b"), tag("b4"), tag("b4b")],
    });
    const satellites = (hub: "a" | "b") =>
      [1, 2, 3, 4].map(i => makeBookmark({
        id: `${hub}${i}`,
        tags: [tag(`${hub}${i}`), tag(`${hub}${i}b`)],
      }));
    const peers = [hubA, hubB, ...satellites("a"), ...satellites("b")];
    const target = makeBookmark({
      id: "center",
      relationships: peers.map(rel),
    });
    const graph = buildBookmarkGraph(target, [target, ...peers], {
      ...TAGS_ONLY,
      maxRelated: 20,
    });

    // Every explicit center spoke survives (score floored to 1, weaker than any peer edge).
    for (const peer of peers) {
      expect(edgeBetween(graph, "center", peer.id)?.explicit).toBe(true);
    }
    // Hub↔satellite edges (score 6) rank in each hub's top 4 and survive.
    expect(edgeBetween(graph, "hubA", "a1")?.score).toBe(6);
    expect(edgeBetween(graph, "hubB", "b4")?.score).toBe(6);
    // The hub↔hub edge (score 3) ranks 5th on both endpoints and is pruned.
    expect(edgeBetween(graph, "hubA", "hubB")).toBeUndefined();
  });

  it("weights each node by the sum of its kept incident edge scores", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const peer1 = makeBookmark({
      id: "b",
      tags: [tag("x"), tag("y")],
    });
    const peer2 = makeBookmark({
      id: "c",
      tags: [tag("x"), tag("y")],
    });
    const graph = buildBookmarkGraph(target, [target, peer1, peer2], TAGS_ONLY);
    // a–b and a–c share x (3 each); b–c share x and y (6).
    const weights = new Map(graph.nodes.map(node => [node.bookmark.id, node.weight]));
    expect(weights.get("a")).toBe(6);
    expect(weights.get("b")).toBe(9);
    expect(weights.get("c")).toBe(9);
    expect(graph.maxScore).toBe(6);
    expect(graph.maxWeight).toBe(9);
  });

  it("assigns BFS distance: center 0, layer-1 peers 1", () => {
    const target = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const peer = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const dist = distanceMap(buildBookmarkGraph(target, [target, peer], TAGS_ONLY));
    expect(dist.get("a")).toBe(0);
    expect(dist.get("b")).toBe(1);
  });
});

describe("buildBookmarkGraph expansion", () => {
  it("adds an expanded peer's own related set as distance-2 nodes", () => {
    const a = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const b = makeBookmark({
      id: "b",
      tags: [tag("x"), tag("y")],
    });
    const c = makeBookmark({
      id: "c",
      tags: [tag("y")],
    });
    const all = [a, b, c];
    // c shares nothing with the center, so it is absent until b is expanded.
    expect(buildBookmarkGraph(a, all, TAGS_ONLY).nodes.some(node => node.bookmark.id === "c")).toBe(false);

    const graph = buildBookmarkGraph(a, all, TAGS_ONLY, {
      expandedIds: new Set(["b"]),
    });
    const dist = distanceMap(graph);
    expect(dist.get("a")).toBe(0);
    expect(dist.get("b")).toBe(1);
    expect(dist.get("c")).toBe(2);
    expect(edgeBetween(graph, "b", "c")).toBeDefined();
  });

  it("dedupes a child that is also a layer-1 peer into one node", () => {
    const a = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const b = makeBookmark({
      id: "b",
      tags: [tag("x"), tag("y")],
    });
    const c = makeBookmark({
      id: "c",
      tags: [tag("x"), tag("y")],
    });
    const graph = buildBookmarkGraph(a, [a, b, c], TAGS_ONLY, {
      expandedIds: new Set(["b"]),
    });
    expect(graph.nodes.filter(node => node.bookmark.id === "c")).toHaveLength(1);
  });

  it("expands nested — an expanded child's own related set becomes distance-3", () => {
    const a = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const b = makeBookmark({
      id: "b",
      tags: [tag("x"), tag("y")],
    });
    const c = makeBookmark({
      id: "c",
      tags: [tag("y"), tag("z")],
    });
    const d = makeBookmark({
      id: "d",
      tags: [tag("z")],
    });
    const graph = buildBookmarkGraph(a, [a, b, c, d], TAGS_ONLY, {
      expandedIds: new Set(["b", "c"]),
    });
    const dist = distanceMap(graph);
    expect(dist.get("c")).toBe(2);
    expect(dist.get("d")).toBe(3);
  });

  it("keeps ALL of an expanded (focus) node's spokes, past the top-K peer limit", () => {
    const center = makeBookmark({
      id: "center",
      tags: [tag("p0")],
    });
    const childCount = 6;
    const children = Array.from({
      length: childCount,
    }, (_, i) =>
      makeBookmark({
        id: `c${i}`,
        // A strong mesh among the children (score 6) outranks each weak spoke to the parent (score 3).
        tags: [tag(`u${i}`), tag("common1"), tag("common2")],
      }));
    const parent = makeBookmark({
      id: "p",
      tags: [tag("p0"), ...children.map((_, i) => tag(`u${i}`))],
    });
    const graph = buildBookmarkGraph(center, [center, parent, ...children], TAGS_ONLY, {
      expandedIds: new Set(["p"]),
    });
    for (let i = 0; i < childCount; i += 1) {
      expect(edgeBetween(graph, "p", `c${i}`)).toBeDefined();
    }
  });

  it("ignores an expanded id that is not displayed", () => {
    const a = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const b = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const graph = buildBookmarkGraph(a, [a, b], TAGS_ONLY, {
      expandedIds: new Set(["ghost"]),
    });
    expect(graph.nodes.map(node => node.bookmark.id).sort()).toEqual(["a", "b"]);
  });
});

describe("neighborsOf", () => {
  it("returns edge-adjacent ids from either direction and excludes self", () => {
    const a = makeBookmark({
      id: "a",
      tags: [tag("x")],
    });
    const b = makeBookmark({
      id: "b",
      tags: [tag("x")],
    });
    const c = makeBookmark({
      id: "c",
      tags: [tag("x")],
    });
    const graph = buildBookmarkGraph(a, [a, b, c], TAGS_ONLY);
    const result = neighborsOf(graph, "a");
    expect(result.has("b")).toBe(true);
    expect(result.has("c")).toBe(true);
    expect(result.has("a")).toBe(false);
  });
});

describe("render-scale helpers", () => {
  it("clamps nodeRadius into its bounds and is zero-safe", () => {
    expect(nodeRadius(0, 0)).toBe(6);
    expect(nodeRadius(0, 10)).toBe(6);
    expect(nodeRadius(10, 10)).toBe(16);
    expect(nodeRadius(5, 10)).toBeGreaterThan(6);
    expect(nodeRadius(5, 10)).toBeLessThan(16);
  });

  it("clamps edgeStrokeWidth and edgeOpacity into their bounds and is zero-safe", () => {
    expect(edgeStrokeWidth(0, 0)).toBe(1);
    expect(edgeStrokeWidth(6, 6)).toBe(3);
    expect(edgeOpacity(0, 0)).toBe(0.25);
    expect(edgeOpacity(6, 6)).toBe(0.85);
  });

  it("truncates long labels with an ellipsis and keeps short ones intact", () => {
    expect(truncateLabel("Short title")).toBe("Short title");
    expect(truncateLabel("A very long bookmark title indeed")).toHaveLength(18);
    expect(truncateLabel("A very long bookmark title indeed").endsWith("…")).toBe(true);
  });

  it("fades node opacity by distance, monotonically, with a floor", () => {
    expect(nodeOpacityForDistance(0)).toBe(1);
    expect(nodeOpacityForDistance(1)).toBe(1);
    expect(nodeOpacityForDistance(2)).toBeCloseTo(0.85);
    expect(nodeOpacityForDistance(2)).toBeLessThan(nodeOpacityForDistance(1));
    expect(nodeOpacityForDistance(20)).toBe(0.55);
  });
});
