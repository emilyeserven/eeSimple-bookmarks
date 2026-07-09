import { useCallback, useRef, useState } from "react";

interface UseHorizontalSplitOptions {
  /** Starting split — the left pane's percentage of the container width. Default 50. */
  initial?: number;
  /** Clamp bounds for the left pane's percentage. Default 20–80. */
  min?: number;
  max?: number;
}

/**
 * A percentage-based horizontal split with a draggable divider — the sibling of the fixed-width
 * {@link import("./useResizeHandle").useResizeHandle} (which sizes the sidebar in rem). Returns a
 * `containerRef` to put on the flex row, the left pane's `percent` (start `initial`, clamped to
 * `[min, max]`), and an `onHandlePointerDown` for the divider. The divider captures the pointer and
 * tracks its x relative to the container so the drag continues even if the cursor leaves the handle
 * (mirroring `useResizeHandle`'s idiom). Size the two panes by flex-grow ratio (`percent` /
 * `100 - percent`) so the split never overflows the row.
 */
export function useHorizontalSplit({
  initial = 50,
  min = 20,
  max = 80,
}: UseHorizontalSplitOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(initial);

  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (ev: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setPercent(Math.min(max, Math.max(min, pct)));
    };

    const onPointerUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [min, max]);

  return {
    containerRef,
    percent,
    onHandlePointerDown,
  };
}
