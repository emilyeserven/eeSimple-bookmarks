import "@testing-library/jest-dom/vitest";

// jsdom lacks a few DOM APIs that Radix UI primitives (Popover/Select) and cmdk
// rely on. Stub them so component tests can open menus and scroll into view.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {
    // no-op: layout/scrolling is irrelevant under jsdom
  };
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {
    // no-op: pointer capture is unsupported in jsdom
  };
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {
    // no-op: pointer capture is unsupported in jsdom
  };
}
// jsdom defines window.scrollTo but it throws "Not implemented"; TanStack Router's scroll
// restoration calls it on navigation, so replace it with a no-op.
window.scrollTo = () => {
  // no-op: scrolling is irrelevant under jsdom
};
// jsdom doesn't implement matchMedia; the responsive `useIsMobile` hook calls it. Report a
// non-mobile, non-listening viewport so components relying on it render their desktop layout.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {
      // no-op: no media changes under jsdom
    },
    removeEventListener: () => {
      // no-op
    },
    addListener: () => {
      // no-op: legacy API
    },
    removeListener: () => {
      // no-op: legacy API
    },
    dispatchEvent: () => false,
  });
}
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {
      // no-op: no layout to observe under jsdom
    }

    unobserve() {
      // no-op
    }

    disconnect() {
      // no-op
    }
  };
}
