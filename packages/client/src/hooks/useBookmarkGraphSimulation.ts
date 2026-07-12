import type { BookmarkGraphModel } from "../lib/bookmarkGraph";
import type { BookmarkGraphPoint, BookmarkGraphSimulation, GraphSimNode } from "../lib/bookmarkGraphLayout";
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from "react";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { applyForces, clampPoint, createBookmarkGraphSimulation, reconcileSimulation, toSimLinks } from "../lib/bookmarkGraphLayout";

/** Movement past this many client px turns a press into a drag (so a jittery tap doesn't nudge a node). */
const DRAG_THRESHOLD_PX = 4;

interface NodePointerHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
}

export interface UseBookmarkGraphSimulationResult {
  svgRef: RefObject<SVGSVGElement | null>;
  /** The transformed content `<g>` — its CTM composes the zoom/pan, so pointer math stays correct. */
  contentRef: RefObject<SVGGElement | null>;
  /** Clamped current position for a node id, read fresh each render (positions come from the sim, not state). */
  getPoint: (id: string) => BookmarkGraphPoint | undefined;
  /** Per-node pointer handlers implementing drag-vs-tap; a tap (no drag) calls `onSelect`. */
  nodeHandlers: (id: string) => NodePointerHandlers;
}

interface UseBookmarkGraphSimulationOptions {
  width: number;
  height: number;
  /** Node-spacing multiplier (the user's slider); re-applied to the live sim when it changes. */
  spacing: number;
  /** Set by the "+" handler to the just-expanded parent id, so new nodes seed near it, then cleared. */
  justExpandedRef: MutableRefObject<string | null>;
  onSelect: (id: string) => void;
}

/**
 * Drive a live d3-force simulation for the bookmark graph: bridge d3's ticks to React renders (rAF-
 * coalesced), reconcile the running sim when the model changes (expand/collapse) without resetting
 * positions, and expose per-node drag handlers. Positions are read from the mutated sim datums via
 * {@link UseBookmarkGraphSimulationResult.getPoint}, so re-renders only re-paint — no per-frame
 * allocation. Branch-dense drag/rAF logic lives in the module-level helpers below to stay under the
 * fallow complexity cap.
 */
export function useBookmarkGraphSimulation(
  model: BookmarkGraphModel,
  {
    width, height, spacing, justExpandedRef, onSelect,
  }: UseBookmarkGraphSimulationOptions,
): UseBookmarkGraphSimulationResult {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const contentRef = useRef<SVGGElement | null>(null);
  const simRef = useRef<BookmarkGraphSimulation | null>(null);
  const [, bumpTick] = useReducer((count: number) => count + 1, 0);

  // Latest spacing + model, read by the reconcile/spacing effects without re-subscribing.
  const spacingRef = useRef(spacing);
  spacingRef.current = spacing;
  const modelRef = useRef(model);
  modelRef.current = model;

  if (simRef.current === null) {
    simRef.current = createBookmarkGraphSimulation(model, {
      width,
      height,
      spacing,
    });
  }

  // Bridge d3 ticks → React renders, coalesced to one commit per animation frame. d3 halts its own
  // timer when alpha decays, so the tick handler simply stops firing — no manual polling loop.
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    const scheduler = createRafScheduler(() => {
      if (sim.simulation.alpha() >= sim.simulation.alphaMin()) bumpTick();
    });
    sim.simulation.on("tick", scheduler.schedule);
    return () => {
      sim.simulation.on("tick", null);
      sim.simulation.stop();
      scheduler.cancel();
    };
  }, []);

  // Reconcile the running sim when the model changes (expand/collapse), preserving positions.
  const isFirstModel = useRef(true);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    if (isFirstModel.current) {
      isFirstModel.current = false;
      return;
    }
    reconcileSimulation(sim, model, justExpandedRef.current, spacingRef.current);
    justExpandedRef.current = null;
    bumpTick();
  }, [model, justExpandedRef]);

  // Re-apply the layout forces live when the spacing slider changes (skip the initial mount, whose
  // forces were set at create — a reheat there would cut the intro animation short).
  const isFirstSpacing = useRef(true);
  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    if (isFirstSpacing.current) {
      isFirstSpacing.current = false;
      return;
    }
    applyForces(sim.simulation, toSimLinks(modelRef.current), {
      width,
      height,
      spacing,
    });
    sim.simulation.alpha(0.3).restart();
  }, [spacing, width, height]);

  const getPoint = useCallback((id: string): BookmarkGraphPoint | undefined => {
    const sim = simRef.current;
    const node = sim?.nodeById.get(id);
    return node ? clampPoint(node, width, height) : undefined;
  }, [width, height]);

  const nodeHandlers = useCallback((id: string): NodePointerHandlers => ({
    onPointerDown: (e) => {
      const sim = simRef.current;
      // Map through the transformed content <g> (its CTM includes zoom/pan) so a dragged node lands
      // under the pointer at any view; fall back to the svg before the <g> has mounted.
      const mapEl = contentRef.current ?? svgRef.current;
      const node = sim?.nodeById.get(id);
      if (!sim || !mapEl || !node) return;
      beginDrag({
        simulation: sim.simulation,
        mapEl,
        node,
        pointerId: e.pointerId,
        startClient: {
          x: e.clientX,
          y: e.clientY,
        },
        onSelect,
      });
      e.currentTarget.setPointerCapture(e.pointerId);
    },
  }), [onSelect]);

  return {
    svgRef,
    contentRef,
    getPoint,
    nodeHandlers,
  };
}

/** A requestAnimationFrame throttle: many calls within one frame coalesce into a single `cb`. */
function createRafScheduler(cb: () => void): { schedule: () => void;
  cancel: () => void; } {
  let frame = 0;
  return {
    schedule: () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        cb();
      });
    },
    cancel: () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}

/**
 * Map a client (screen) point into an SVG element's local coordinate space — robust to CSS scaling
 * and, when `el` is the transformed content `<g>`, to the zoom/pan transform (its CTM composes it).
 */
function clientToLocalPoint(el: SVGGraphicsElement, clientX: number, clientY: number): BookmarkGraphPoint | null {
  const ctm = el.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return {
    x: pt.x,
    y: pt.y,
  };
}

interface DragContext {
  simulation: BookmarkGraphSimulation["simulation"];
  mapEl: SVGGraphicsElement;
  node: GraphSimNode;
  pointerId: number;
  startClient: BookmarkGraphPoint;
  onSelect: (id: string) => void;
}

/** Install the drag lifecycle: pin the node under the pointer, reheat, and wire window move/up. */
function beginDrag(ctx: DragContext): void {
  const state = {
    moved: false,
  };
  ctx.simulation.alphaTarget(0.3).restart();

  const onMove = (ev: PointerEvent) => handleDragMove(ctx, state, ev);
  const onUp = (ev: PointerEvent) => {
    handleDragEnd(ctx, state, ev);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

/** While dragging: past the threshold, pin the node (peers only) to the mapped pointer position. */
function handleDragMove(ctx: DragContext, state: { moved: boolean }, ev: PointerEvent): void {
  if (ev.pointerId !== ctx.pointerId) return;
  const distance = Math.hypot(ev.clientX - ctx.startClient.x, ev.clientY - ctx.startClient.y);
  if (distance < DRAG_THRESHOLD_PX) return;
  state.moved = true;
  if (ctx.node.isCenter) return;
  const point = clientToLocalPoint(ctx.mapEl, ev.clientX, ev.clientY);
  if (!point) return;
  ctx.node.fx = point.x;
  ctx.node.fy = point.y;
}

/**
 * On release: cool the sim toward rest. A dragged peer stays pinned where it was dropped (Obsidian-
 * style — the node keeps the `fx/fy` set during the drag), so the user's arrangement holds. A press
 * with no movement is a tap → select.
 */
function handleDragEnd(ctx: DragContext, state: { moved: boolean }, ev: PointerEvent): void {
  if (ev.pointerId !== ctx.pointerId) return;
  ctx.simulation.alphaTarget(0);
  if (!state.moved) ctx.onSelect(ctx.node.id);
}
