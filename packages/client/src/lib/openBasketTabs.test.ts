// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { openBasketTabs } from "./openBasketTabs";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("openBasketTabs", () => {
  it("opens each url in a new noopener tab, in order", () => {
    const open = vi.fn();
    vi.stubGlobal("window", {
      open,
    });

    openBasketTabs(["https://a.example", "https://b.example"]);

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(1, "https://a.example", "_blank", "noopener");
    expect(open).toHaveBeenNthCalledWith(2, "https://b.example", "_blank", "noopener");
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
