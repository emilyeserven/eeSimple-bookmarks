import { describe, expect, it } from "vitest";

import { hasSidebarModifier } from "./sidebarModifier";

/** A mouse event with every modifier flag off, overridable per case. */
function event(overrides: Partial<Record<"altKey" | "ctrlKey" | "shiftKey" | "metaKey", boolean>>) {
  return {
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    ...overrides,
  };
}

describe("hasSidebarModifier", () => {
  it("matches each modifier to its event flag", () => {
    expect(hasSidebarModifier(event({
      altKey: true,
    }), "alt")).toBe(true);
    expect(hasSidebarModifier(event({
      ctrlKey: true,
    }), "ctrl")).toBe(true);
    expect(hasSidebarModifier(event({
      shiftKey: true,
    }), "shift")).toBe(true);
    expect(hasSidebarModifier(event({
      metaKey: true,
    }), "meta")).toBe(true);
  });

  it("is false when the configured modifier is not held", () => {
    expect(hasSidebarModifier(event({}), "alt")).toBe(false);
    // A different modifier held does not count as the configured one.
    expect(hasSidebarModifier(event({
      ctrlKey: true,
    }), "alt")).toBe(false);
  });
});
