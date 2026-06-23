import * as React from "react";
import { useRef, useState } from "react";

const THRESHOLD = 80;

/** Track a horizontal swipe gesture and fire callbacks when the threshold is exceeded. */
export function useSwipeGesture(onSwipeRight: () => void, onSwipeLeft: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [displacement, setDisplacement] = useState(0);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    // If vertical scroll is dominant early in the gesture, abort horizontal tracking.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(displacement) < 10) {
      startX.current = null;
      return;
    }
    setDisplacement(dx);
  }

  function onTouchEnd() {
    if (displacement >= THRESHOLD) onSwipeRight();
    else if (displacement <= -THRESHOLD) onSwipeLeft();
    setDisplacement(0);
    startX.current = null;
    startY.current = null;
  }

  return {
    displacement,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
