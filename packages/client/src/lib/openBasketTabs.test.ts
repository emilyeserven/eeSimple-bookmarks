// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { openBasketTabs } from "./openBasketTabs";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openBasketTabs", () => {
  it("opens each url as a plain _blank tab (no features string) and nulls the opener, in order", () => {
    const openedWindows: { opener: unknown }[] = [];
    const open = vi.fn(() => {
      const win = {
        opener: {} as unknown,
      };
      openedWindows.push(win);
      return win;
    });
    vi.stubGlobal("window", {
      open,
    });

    openBasketTabs(["https://a.example", "https://b.example"]);

    expect(open).toHaveBeenCalledTimes(2);
    // No third (window-features) argument — that is what turned tabs into Little Arc popups.
    expect(open).toHaveBeenNthCalledWith(1, "https://a.example", "_blank");
    expect(open).toHaveBeenNthCalledWith(2, "https://b.example", "_blank");
    // opener severed on each opened window.
    expect(openedWindows.every(w => w.opener === null)).toBe(true);
  });

  it("tolerates window.open returning null (popup blocked) without throwing", () => {
    const open = vi.fn(() => null);
    vi.stubGlobal("window", {
      open,
    });

    expect(() => openBasketTabs(["https://a.example"])).not.toThrow();
    expect(open).toHaveBeenCalledOnce();
  });

  it("does nothing for an empty list", () => {
    const open = vi.fn();
    vi.stubGlobal("window", {
      open,
    });

    openBasketTabs([]);

    expect(open).not.toHaveBeenCalled();
  });
});
