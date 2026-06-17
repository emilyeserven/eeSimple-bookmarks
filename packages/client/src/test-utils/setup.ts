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
