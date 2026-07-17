import "@testing-library/jest-dom/vitest";

// Initialize i18next synchronously (defaults to `lng: "en"`), so any component under test that calls
// `useTranslation()`/`t()` renders its English-phrase keys verbatim — no assertion changes needed.
import "../i18n";

// Pure lib tests opt into the faster `node` environment via a per-file
// `@vitest-environment node` pragma; skip the DOM stubs when no DOM exists.
if (typeof window !== "undefined") {
  // Fresh-world reset. The dom-fast project runs with `isolate: false`, so the jsdom window
  // and the module graph outlive a single test file: only this setup file (and the test file
  // itself) re-execute per file. Restore the invariants a fresh environment used to provide.
  document.body.innerHTML = "";
  window.localStorage.clear();
  window.sessionStorage.clear();

  // RTL registers its auto-cleanup afterEach only when its module is first evaluated; with the
  // module cache reused across files that registration doesn't recur. Register it explicitly
  // per file (a duplicate cleanup() is a harmless no-op). Lazy import keeps node-pragma files
  // from paying for react-dom.
  const {
    cleanup,
  } = await import("@testing-library/react");
  afterEach(cleanup);

  // Module-singleton zustand stores persist across files in a non-isolated worker.
  const {
    resetAllStores,
  } = await import("./resetStores");
  resetAllStores();

  // jsdom lacks a few DOM APIs that Radix UI primitives (Popover/Select) and cmdk
  // rely on. Stub them so component tests can open menus and scroll into view.
  //
  // These stubs let the Radix portal mount, but jsdom still won't deliver the
  // pointer-driven *open* — `fireEvent.pointerDown`/`click` on the trigger does nothing.
  // Open a Radix trigger with a keyboard event instead, then click the revealed item:
  //   fireEvent.keyDown(trigger, { key: "ArrowDown" }); // Select -> role="option"
  //   fireEvent.keyDown(trigger, { key: " " });         // DropdownMenu -> role="menuitem"
  // See components/conditions/PropertyConditionEditor.test.tsx for a worked example.
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
}
