import type { BookmarkGraphPoint, ViewTransform } from "../lib/bookmarkGraphLayout";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

import { useCallback, useEffect, useState } from "react";

import { IDENTITY_TRANSFORM, panBy, VIEW_HEIGHT, VIEW_WIDTH, zoomAtPoint } from "../lib/bookmarkGraphLayout";

/** Per-button zoom step (in/out multiply/divide by this). */
const BUTTON_ZOOM_FACTOR = 1.2;
/** Wheel sensitivity — `deltaY` scaled through `exp` for smooth, direction-correct zooming. */
const WHEEL_ZOOM_SENSITIVITY = 0.001;
/** Movement past this many client px turns a background press into a pan (a still press deselects). */
const PAN_THRESHOLD_PX = 4;

/** The viewBox-space center, the focus point for the +/− buttons (they zoom about the canvas middle). */
const CENTER: BookmarkGraphPoint = {
  x: VIEW_WIDTH / 2,
  y: VIEW_HEIGHT / 2,
};

export interface UseBookmarkGraphViewportResult {
  /** The live viewport transform (zoom + pan) over the fixed viewBox. */
  view: ViewTransform;
  /** The ready-to-use SVG `transform` attribute for the content `<g>`. */
  transform: string;
  /** True while a background pan drag is in progress (drives the grabbing cursor). */
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  /** Background pointerdown: begins a pan; a press with no movement runs `onBackgroundTap`. */
  onBackgroundPointerDown: (e: ReactPointerEvent) => void;
}

/**
 * Own the bookmark graph's viewport (zoom + pan) as a layer over the fixed viewBox. Wheel zooms
 * toward the cursor (non-passive so the page doesn't scroll), the buttons zoom about the canvas
 * center, and dragging empty space pans. The transform is ephemeral — it resets to identity whenever
 * `resetKey` changes (i.e. the user navigates to a different bookmark's graph). All the transform math
 * lives in the pure `bookmarkGraphLayout` helpers; this hook only wires events to them.
 */
export function useBookmarkGraphViewport(
  svgRef: RefObject<SVGSVGElement | null>,
  {
    resetKey,
    onBackgroundTap,
  }: { resetKey: string;
    onBackgroundTap: () => void; },
): UseBookmarkGraphViewportResult {
  const [view, setView] = useState<ViewTransform>(IDENTITY_TRANSFORM);
  const [isPanning, setIsPanning] = useState(false);

  // Reset the viewport when the graph changes (new center bookmark).
  useEffect(() => {
    setView(IDENTITY_TRANSFORM);
  }, [resetKey]);

  // Wheel-to-zoom toward the cursor. Registered imperatively as a non-passive listener so
  // `preventDefault` can stop the page from scrolling while zooming the graph.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const focus = clientToViewBox(svg, e.clientX, e.clientY);
      if (!focus) return;
      const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY);
      setView(current => zoomAtPoint(current, factor, focus));
    };
    svg.addEventListener("wheel", onWheel, {
      passive: false,
    });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [svgRef]);

  const zoomIn = useCallback(() => setView(current => zoomAtPoint(current, BUTTON_ZOOM_FACTOR, CENTER)), []);
  const zoomOut = useCallback(() => setView(current => zoomAtPoint(current, 1 / BUTTON_ZOOM_FACTOR, CENTER)), []);
  const reset = useCallback(() => setView(IDENTITY_TRANSFORM), []);

  const onBackgroundPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.target !== e.currentTarget) return;
    const svg = svgRef.current;
    if (!svg) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    beginPan({
      svg,
      pointerId: e.pointerId,
      startClient: {
        x: e.clientX,
        y: e.clientY,
      },
      setView,
      setIsPanning,
      onBackgroundTap,
    });
  }, [svgRef, onBackgroundTap]);

  return {
    view,
    transform: `translate(${view.tx} ${view.ty}) scale(${view.k})`,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    onBackgroundPointerDown,
  };
}

/** Map a client point into the svg's viewBox space (the coordinate space the pan/zoom transform lives in). */
function clientToViewBox(svg: SVGSVGElement, clientX: number, clientY: number): BookmarkGraphPoint | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return {
    x: pt.x,
    y: pt.y,
  };
}

interface PanContext {
  svg: SVGSVGElement;
  pointerId: number;
  startClient: BookmarkGraphPoint;
  setView: (updater: (current: ViewTransform) => ViewTransform) => void;
  setIsPanning: (value: boolean) => void;
  onBackgroundTap: () => void;
}

/**
 * Install a background pan drag: translate the view by each pointer delta (converted from client px to
 * viewBox units by the current CSS scale — pan is scale-independent since `translate` composes in the
 * outer viewBox space). A press with no movement past the threshold is a background tap → deselect.
 */
function beginPan(ctx: PanContext): void {
  const rect = ctx.svg.getBoundingClientRect();
  const scaleX = rect.width / VIEW_WIDTH;
  const scaleY = rect.height / VIEW_HEIGHT;
  const state = {
    moved: false,
    last: ctx.startClient,
  };
  ctx.setIsPanning(true);

  const onMove = (ev: PointerEvent) => {
    if (ev.pointerId !== ctx.pointerId) return;
    if (!state.moved && Math.hypot(ev.clientX - ctx.startClient.x, ev.clientY - ctx.startClient.y) < PAN_THRESHOLD_PX) {
      return;
    }
    const dxSvg = (ev.clientX - state.last.x) / scaleX;
    const dySvg = (ev.clientY - state.last.y) / scaleY;
    state.moved = true;
    state.last = {
      x: ev.clientX,
      y: ev.clientY,
    };
    ctx.setView(current => panBy(current, dxSvg, dySvg));
  };
  const onUp = (ev: PointerEvent) => {
    if (ev.pointerId !== ctx.pointerId) return;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    ctx.setIsPanning(false);
    if (!state.moved) ctx.onBackgroundTap();
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}
