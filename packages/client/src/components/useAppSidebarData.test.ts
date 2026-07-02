// @vitest-environment node
import type { ResolvedPin } from "./useAppSidebarData";

import { describe, expect, it } from "vitest";

import { paginatePins } from "./useAppSidebarData";

function pins(n: number): ResolvedPin[] {
  return Array.from({
    length: n,
  }, (_, i) => ({
    id: `p${i}`,
    label: `Pin ${i}`,
    icon: null,
    link: {
      kind: "path",
      path: `/x/${i}`,
    },
    isActive: false,
  }));
}

describe("paginatePins", () => {
  it("shows the first 5 with a Show More affordance when collapsed and there are more", () => {
    const result = paginatePins(pins(8), {
      pinnedExpanded: false,
      pinnedShowAll: false,
    });
    expect(result.visiblePins).toHaveLength(5);
    expect(result.hasShowMore).toBe(true);
    expect(result.hasSeeAll).toBe(false);
    expect(result.hasShowLess).toBe(false);
  });

  it("does not offer Show More when there are 5 or fewer", () => {
    const result = paginatePins(pins(5), {
      pinnedExpanded: false,
      pinnedShowAll: false,
    });
    expect(result.visiblePins).toHaveLength(5);
    expect(result.hasShowMore).toBe(false);
  });

  it("shows up to 10 with a See All affordance when expanded and there are more than 10", () => {
    const result = paginatePins(pins(14), {
      pinnedExpanded: true,
      pinnedShowAll: false,
    });
    expect(result.visiblePins).toHaveLength(10);
    expect(result.hasShowMore).toBe(false);
    expect(result.hasSeeAll).toBe(true);
    expect(result.hasShowLess).toBe(true);
  });

  it("shows everything with a Show Less affordance when showAll is set", () => {
    const result = paginatePins(pins(14), {
      pinnedExpanded: true,
      pinnedShowAll: true,
    });
    expect(result.visiblePins).toHaveLength(14);
    expect(result.hasShowMore).toBe(false);
    expect(result.hasSeeAll).toBe(false);
    expect(result.hasShowLess).toBe(true);
  });

  it("offers Show Less only once the list has been expanded", () => {
    const collapsed = paginatePins(pins(8), {
      pinnedExpanded: false,
      pinnedShowAll: false,
    });
    expect(collapsed.hasShowLess).toBe(false);

    const expanded = paginatePins(pins(8), {
      pinnedExpanded: true,
      pinnedShowAll: false,
    });
    expect(expanded.hasShowLess).toBe(true);
  });
});
