import { useCallback, useRef } from "react";

interface UseResizeHandleOptions {
  /** Which edge the handle sits on. "right" = right edge of left sidebar; "left" = left edge of right panel. */
  direction: "right" | "left";
  currentWidth: number;
  onChange: (newWidth: number) => void;
  min: number;
  max: number;
}

const ROOT_FONT_SIZE = 16;

export function useResizeHandle({
  direction,
  currentWidth,
  onChange,
  min,
  max,
}: UseResizeHandleOptions) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;

    // Capture so the drag continues even if the cursor leaves the element.
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.documentElement.classList.add("sidebar-resizing");

    const onPointerMove = (ev: PointerEvent) => {
      const deltaRem = (ev.clientX - startXRef.current) / ROOT_FONT_SIZE;
      const sign = direction === "right" ? 1 : -1;
      const newWidth = Math.min(max, Math.max(min, startWidthRef.current + sign * deltaRem));
      onChange(newWidth);
    };

    const onPointerUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.documentElement.classList.remove("sidebar-resizing");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [currentWidth, direction, min, max, onChange]);

  return {
    onPointerDown,
  };
}
