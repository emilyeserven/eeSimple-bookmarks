import { useEffect, useState } from "react";

/**
 * Tracks the live border-box width of the first element matching `selector`, returning `null` when
 * no such element exists (e.g. an empty listing). Used to size the Card Options preview to the real
 * bookmark card currently on the page. Re-measures via a ResizeObserver as the viewport or column
 * count changes; retries once on the next frame if the element isn't in the DOM on first paint.
 */
export function useObservedWidth(selector: string): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let frame = 0;

    function attach() {
      const element = document.querySelector(selector);
      if (!element) {
        // The card may not be painted yet on first open; try once more next frame.
        frame = requestAnimationFrame(attach);
        return;
      }
      setWidth(element.getBoundingClientRect().width);
      observer = new ResizeObserver(() => {
        setWidth(element.getBoundingClientRect().width);
      });
      observer.observe(element);
    }

    attach();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [selector]);

  return width;
}

/**
 * Tracks the live (unscaled) offset height of the element held by `ref` via a ResizeObserver.
 * Transforms don't affect the layout box, so this stays the natural height even when the element is
 * CSS-scaled — letting a scaled preview reserve the right amount of space.
 */
export function useElementHeight(ref: React.RefObject<HTMLElement | null>): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setHeight(element.offsetHeight);
    });
    observer.observe(element);
    setHeight(element.offsetHeight);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
