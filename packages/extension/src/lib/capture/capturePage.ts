/*
 * Page-side halves of the full-page capture. Each function is serialized into the tab by
 * `browser.scripting.executeScript({ func })`, so it must be fully self-contained: no imports, no
 * closures over module state — only its arguments and page globals.
 */

interface CaptureState {
  x: number;
  y: number;
  scrollBehavior: string;
  fixedScanned?: boolean;
  /** [element, previous inline visibility, previous priority] for each hidden fixed/sticky element. */
  hidden: [HTMLElement, string, string][];
}

declare global {
  interface Window {
    __eesimpleCaptureState?: CaptureState;
  }
}

/** The page's scroll metrics, read once before capturing. */
export interface PageMetrics {
  scrollHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

/** Record the scroll position and disable smooth scrolling; return the page metrics. */
export function pagePrepare(): PageMetrics {
  const root = document.documentElement;
  window.__eesimpleCaptureState = {
    x: window.scrollX,
    y: window.scrollY,
    scrollBehavior: root.style.scrollBehavior,
    hidden: [],
  };
  // Smooth scrolling would make the scrollTo below land late.
  root.style.scrollBehavior = "auto";
  const body = document.body as HTMLElement | null;
  return {
    scrollHeight: Math.max(root.scrollHeight, body?.scrollHeight ?? 0, root.offsetHeight, body?.offsetHeight ?? 0),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}

/**
 * Scroll to `y` and return where the page actually landed. With `hideFixed`, fixed/sticky elements
 * are hidden (once) so headers and cookie bars aren't repeated down the stitched image.
 */
export function pageScrollTo(y: number, hideFixed: boolean): number {
  const state = window.__eesimpleCaptureState;
  if (hideFixed && state && !state.fixedScanned) {
    state.fixedScanned = true;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const position = getComputedStyle(el).position;
      if (position !== "fixed" && position !== "sticky") continue;
      state.hidden.push([el, el.style.getPropertyValue("visibility"), el.style.getPropertyPriority("visibility")]);
      el.style.setProperty("visibility", "hidden", "important");
    }
  }
  window.scrollTo(0, y);
  return window.scrollY;
}

/** Restore hidden elements, smooth scrolling and the original scroll position. */
export function pageRestore(): void {
  const state = window.__eesimpleCaptureState;
  if (!state) return;
  for (const [el, value, priority] of state.hidden) {
    if (value) el.style.setProperty("visibility", value, priority);
    else el.style.removeProperty("visibility");
  }
  document.documentElement.style.scrollBehavior = state.scrollBehavior;
  window.scrollTo(state.x, state.y);
  delete window.__eesimpleCaptureState;
}
