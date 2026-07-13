// @vitest-environment node
import type { ResolvedPin } from "./useAppSidebarData";
import type { PinnedSection } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { groupPinsBySection, paginatePins } from "./useAppSidebarData";

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
    sectionId: null,
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

function pin(id: string, sectionId: string | null): ResolvedPin {
  return {
    id,
    label: id,
    icon: null,
    link: {
      kind: "path",
      path: `/x/${id}`,
    },
    isActive: false,
    sectionId,
  };
}

function section(id: string, sortOrder: number): PinnedSection {
  return {
    id,
    name: id,
    sortOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("groupPinsBySection", () => {
  it("puts pins with no section into the ungrouped bucket and emits no groups", () => {
    const result = groupPinsBySection([pin("a", null), pin("b", null)], []);
    expect(result.ungrouped.map(p => p.id)).toEqual(["a", "b"]);
    expect(result.groups).toHaveLength(0);
  });

  it("groups pins under their section, ordered by the section sortOrder", () => {
    const sections = [section("s2", 1), section("s1", 0)];
    const result = groupPinsBySection(
      [pin("a", "s2"), pin("b", "s1"), pin("c", null)],
      sections,
    );
    expect(result.ungrouped.map(p => p.id)).toEqual(["c"]);
    expect(result.groups.map(g => g.section.id)).toEqual(["s1", "s2"]);
    expect(result.groups[0].pins.map(p => p.id)).toEqual(["b"]);
    expect(result.groups[1].pins.map(p => p.id)).toEqual(["a"]);
  });

  it("omits sections that have no pins", () => {
    const result = groupPinsBySection([pin("a", "s1")], [section("s1", 0), section("s2", 1)]);
    expect(result.groups.map(g => g.section.id)).toEqual(["s1"]);
  });

  it("treats a pin whose section no longer exists as ungrouped", () => {
    const result = groupPinsBySection([pin("a", "gone")], [section("s1", 0)]);
    expect(result.ungrouped.map(p => p.id)).toEqual(["a"]);
    expect(result.groups).toHaveLength(0);
  });
});
