import type { BookmarkGraphModel } from "./bookmarkGraph";
import type { Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";

import { nodeRadius } from "./bookmarkGraph";

export interface BookmarkGraphPoint {
  x: number;
  y: number;
}

/** A d3-force node datum, mutated in place each tick; read back for rendering. */
export interface GraphSimNode extends SimulationNodeDatum {
  id: string;
  radius: number;
  isCenter: boolean;
}

/** A d3-force link datum; `source`/`target` are resolved to node objects by `forceLink`. */
export interface GraphSimLink extends SimulationLinkDatum<GraphSimNode> {
  score: number;
}

/** A live (running, un-ticked) simulation plus the persistent datum arrays the hook mutates. */
export interface BookmarkGraphSimulation {
  simulation: Simulation<GraphSimNode, GraphSimLink>;
  nodes: GraphSimNode[];
  nodeById: Map<string, GraphSimNode>;
  width: number;
  height: number;
}

export interface CreateSimulationOptions {
  width?: number;
  height?: number;
  /** Link-distance multiplier (the user's node-spacing control); 1 = default, <1 closer, >1 spread. */
  spacing?: number;
}

/** Default viewBox — wide enough that the default layout reads spread out (`h-auto w-full` follows it). */
export const VIEW_WIDTH = 800;
export const VIEW_HEIGHT = 560;

/** Padding (beyond each node's radius) kept between a node and the viewBox edge / other nodes, for labels. */
const EDGE_PAD = 20;
/** Ring radius the free nodes are seeded on around the pinned center. */
const SEED_RADIUS = 140;

/**
 * Create a **running, un-ticked** force simulation for `model`. The caller (the graph hook) attaches
 * the tick handler and controls alpha — nothing is run to convergence here, so the layout animates
 * live. The center is pinned mid-canvas; link springs pull a pair tighter and harder the higher its
 * shared score (the "more commonalities, more gravity" semantics), while charge repulsion and
 * collision keep nodes and labels legible and spread out.
 *
 * Tuning constants (viewBox / charge / distance / seed radius) are set for a spacious default and are
 * finalized by visual verification — see the `verify` skill.
 */
export function createBookmarkGraphSimulation(
  model: BookmarkGraphModel,
  {
    width = VIEW_WIDTH, height = VIEW_HEIGHT, spacing = 1,
  }: CreateSimulationOptions = {},
): BookmarkGraphSimulation {
  const nodes: GraphSimNode[] = model.nodes.map((node, index) => ({
    id: node.bookmark.id,
    radius: nodeRadius(node.weight, model.maxWeight),
    isCenter: node.isCenter,
    ...node.isCenter
      ? {
        fx: width / 2,
        fy: height / 2,
      }
      : seedRingPosition(index, width, height),
  }));
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const links = toSimLinks(model);

  const simulation = forceSimulation(nodes);
  applyForces(simulation, links, {
    width,
    height,
    spacing,
  });

  return {
    simulation,
    nodes,
    nodeById,
    width,
    height,
  };
}

/** Build the link datums for the current model edges (fresh objects — `forceLink` owns its own array). */
export function toSimLinks(model: BookmarkGraphModel): GraphSimLink[] {
  return model.edges.map(edge => ({
    source: edge.sourceId,
    target: edge.targetId,
    score: edge.score,
  }));
}

/**
 * (Re)bind the four forces and the link force from `links`. Used on create **and** on reconcile, so
 * the tuning lives in exactly one place and expanded rings inherit the same spread.
 */
export function applyForces(
  simulation: Simulation<GraphSimNode, GraphSimLink>,
  links: GraphSimLink[],
  {
    width, height, spacing = 1,
  }: { width: number;
    height: number;
    spacing?: number; },
): void {
  const maxScore = Math.max(1, ...links.map(link => link.score));
  simulation
    .force("link", forceLink<GraphSimNode, GraphSimLink>(links)
      .id(node => node.id)
      .strength(link => 0.3 + 0.7 * (link.score / maxScore))
      .distance(link => (200 - 110 * (link.score / maxScore)) * spacing))
    .force("charge", forceManyBody().strength(-240 * spacing))
    .force("collide", forceCollide<GraphSimNode>(node => node.radius + EDGE_PAD))
    .force("x", forceX(width / 2).strength(0.03))
    .force("y", forceY(height / 2).strength(0.03));
}

/** Golden-angle seed position for a free node — radiates around the pinned center, not the origin. */
export function seedRingPosition(index: number, width: number, height: number): BookmarkGraphPoint {
  return {
    x: width / 2 + SEED_RADIUS * Math.cos(index * 2.399963),
    y: height / 2 + SEED_RADIUS * Math.sin(index * 2.399963),
  };
}

/**
 * Reconcile a live simulation with a rebuilt `model` (after an expand/collapse) **without** resetting
 * positions: reuse existing datums by id (preserving x/y/vx/vy and any pin), create new ones seeded
 * near the just-expanded parent so the ring grows out of the clicked node, drop departed ids, then
 * rebind nodes + forces and give a moderate reheat. Mutates `sim` in place.
 */
export function reconcileSimulation(
  sim: BookmarkGraphSimulation,
  model: BookmarkGraphModel,
  justExpandedId: string | null,
  spacing = 1,
): void {
  const parent = justExpandedId ? sim.nodeById.get(justExpandedId) : undefined;
  const nextNodes: GraphSimNode[] = model.nodes.map((node, index) => {
    const existing = sim.nodeById.get(node.bookmark.id);
    if (existing) {
      existing.radius = nodeRadius(node.weight, model.maxWeight);
      existing.isCenter = node.isCenter;
      return existing;
    }
    return {
      id: node.bookmark.id,
      radius: nodeRadius(node.weight, model.maxWeight),
      isCenter: node.isCenter,
      ...node.isCenter
        ? {
          fx: sim.width / 2,
          fy: sim.height / 2,
        }
        : seedNearParent(parent, index, sim.width, sim.height),
    };
  });

  sim.nodes = nextNodes;
  sim.nodeById = new Map(nextNodes.map(node => [node.id, node]));
  sim.simulation.nodes(nextNodes);
  applyForces(sim.simulation, toSimLinks(model), {
    width: sim.width,
    height: sim.height,
    spacing,
  });
  sim.simulation.alpha(0.5).restart();
}

/** Seed a brand-new node just off its expanded parent (so the ring grows outward), else on the ring. */
function seedNearParent(
  parent: GraphSimNode | undefined,
  index: number,
  width: number,
  height: number,
): BookmarkGraphPoint {
  if (parent?.x === undefined || parent.y === undefined) return seedRingPosition(index, width, height);
  const angle = index * 2.399963;
  return {
    x: parent.x + (parent.radius + EDGE_PAD + 10) * Math.cos(angle),
    y: parent.y + (parent.radius + EDGE_PAD + 10) * Math.sin(angle),
  };
}

/** The node's current position clamped into the padded viewBox, for rendering. */
export function clampPoint(node: GraphSimNode, width: number, height: number): BookmarkGraphPoint {
  const pad = node.radius + EDGE_PAD;
  return {
    x: clamp(node.x ?? width / 2, pad, width - pad),
    y: clamp(node.y ?? height / 2, pad, height - pad),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
