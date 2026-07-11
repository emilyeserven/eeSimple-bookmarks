import type { BookmarkGraphModel } from "./bookmarkGraph";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";

import { nodeRadius } from "./bookmarkGraph";

export interface BookmarkGraphPoint {
  x: number;
  y: number;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  radius: number;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  score: number;
}

/** Padding (beyond each node's radius) kept between a node and the viewBox edge, for its label. */
const EDGE_PAD = 14;

/**
 * Compute a settled position for every node of `model` inside a `width`×`height` viewBox, via a
 * synchronous d3-force run (the node count is `maxRelated`-bounded, so convergence is milliseconds —
 * no rAF loop or per-tick React state). The center node is pinned mid-canvas; link springs pull a
 * pair tighter and harder the higher its shared score — the "more commonalities, more gravity"
 * semantics — while charge repulsion and collision keep nodes and labels legible.
 */
export function layoutBookmarkGraph(
  model: BookmarkGraphModel,
  width = 600,
  height = 400,
): Map<string, BookmarkGraphPoint> {
  const maxScore = Math.max(1, model.maxScore);
  // Seed the free nodes on a golden-angle ring around the pinned center — d3's own initializer
  // spirals out from the viewBox origin, which converges into a cluster lopsided off the center.
  const nodes: SimNode[] = model.nodes.map((node, index) => ({
    id: node.bookmark.id,
    radius: nodeRadius(node.weight, model.maxWeight),
    ...node.isCenter
      ? {
        fx: width / 2,
        fy: height / 2,
      }
      : {
        x: width / 2 + 80 * Math.cos(index * 2.399963),
        y: height / 2 + 80 * Math.sin(index * 2.399963),
      },
  }));
  const links: SimLink[] = model.edges.map(edge => ({
    source: edge.sourceId,
    target: edge.targetId,
    score: edge.score,
  }));

  const simulation = forceSimulation(nodes)
    .force("link", forceLink<SimNode, SimLink>(links)
      .id(node => node.id)
      .strength(link => 0.3 + 0.7 * (link.score / maxScore))
      .distance(link => 140 - 80 * (link.score / maxScore)))
    .force("charge", forceManyBody().strength(-120))
    .force("collide", forceCollide<SimNode>(node => node.radius + EDGE_PAD))
    .force("x", forceX(width / 2).strength(0.05))
    .force("y", forceY(height / 2).strength(0.05))
    .stop();

  const ticks = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
  simulation.tick(ticks);

  const positions = new Map<string, BookmarkGraphPoint>();
  for (const node of nodes) {
    positions.set(node.id, {
      x: clamp(node.x ?? width / 2, node.radius + EDGE_PAD, width - node.radius - EDGE_PAD),
      y: clamp(node.y ?? height / 2, node.radius + EDGE_PAD, height - node.radius - EDGE_PAD),
    });
  }
  return positions;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
