// @vitest-environment node
import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { computePopulatedLevelGroupIds, computeVisibleLevelGroupIds, findAnchorGroup, placeTypeChoices, resolveVisibleLevelGroupIds } from "./locationLevels";

function group(overrides: Partial<PlaceTypeLevelGroup> & Pick<PlaceTypeLevelGroup, "id">): PlaceTypeLevelGroup {
  return {
    name: overrides.id,
    placeTypes: [],
    displayMode: "area",
    visible: true,
    sortOrder: 0,
    ...overrides,
  };
}

// Country (0) → Region (1) → City (2), most-general first. `levelMode` is absent (→ "current") on
// every group unless a test overrides it via `withLevelMode`.
const groups: PlaceTypeLevelGroup[] = [
  group({
    id: "country",
    placeTypes: ["country"],
    sortOrder: 0,
    showOnMainMap: true,
  }),
  group({
    id: "region",
    placeTypes: ["state", "region"],
    sortOrder: 1,
    showOnMainMap: false,
  }),
  group({
    id: "city",
    placeTypes: ["city", "town"],
    sortOrder: 2,
    showOnMainMap: true,
  }),
];

/** `groups` with one group's persisted `levelMode` overridden — the expansion direction it reads as an anchor. */
function withLevelMode(id: string, levelMode: PlaceTypeLevelGroup["levelMode"]): PlaceTypeLevelGroup[] {
  return groups.map(g => (g.id === id
    ? {
      ...g,
      levelMode,
    }
    : g));
}

describe("computeVisibleLevelGroupIds", () => {
  it("main scope shows only the groups flagged for the main map", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "main",
    });
    expect([...ids].sort()).toEqual(["city", "country"]);
  });

  it("main scope treats a missing showOnMainMap as shown (legacy default)", () => {
    const legacy = groups.map(g => ({
      ...g,
      showOnMainMap: undefined,
    }));
    const ids = computeVisibleLevelGroupIds(legacy, {
      kind: "main",
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark 'current' shows only the groups containing a tagged location's type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["region"],
    });
    expect([...ids]).toEqual(["region"]);
  });

  it("bookmark scope anchors on every tagged location's place type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["country", "city"],
    });
    expect([...ids].sort()).toEqual(["city", "country"]);
  });

  it("bookmark 'above' adds levels broader than the anchor, per its own persisted levelMode", () => {
    const ids = computeVisibleLevelGroupIds(withLevelMode("city", "above"), {
      kind: "bookmark",
      placeTypes: ["city"],
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark 'below' adds levels narrower than the anchor, per its own persisted levelMode", () => {
    const ids = computeVisibleLevelGroupIds(withLevelMode("country", "below"), {
      kind: "bookmark",
      placeTypes: ["country"],
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark scope falls back to all groups when no tagged location's type belongs to a group", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["continent"],
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark scope falls back to all groups when there are no tagged locations", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: [],
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark scope expands each anchor independently, per its own levelMode", () => {
    // 5 levels so the middle ("region") is reachable by neither anchor's own direction — proving
    // the anchors expand independently rather than uniformly across the whole tagged set.
    const wide: PlaceTypeLevelGroup[] = [
      group({
        id: "continent",
        placeTypes: ["continent"],
        sortOrder: 0,
      }),
      group({
        id: "country",
        placeTypes: ["country"],
        sortOrder: 1,
        levelMode: "above",
      }),
      group({
        id: "region",
        placeTypes: ["region"],
        sortOrder: 2,
      }),
      group({
        id: "city",
        placeTypes: ["city"],
        sortOrder: 3,
        levelMode: "below",
      }),
      group({
        id: "district",
        placeTypes: ["district"],
        sortOrder: 4,
      }),
    ];
    const ids = computeVisibleLevelGroupIds(wide, {
      kind: "bookmark",
      placeTypes: ["country", "city"],
    });
    expect([...ids].sort()).toEqual(["city", "continent", "country", "district"]);
  });

  it("location 'current' shows only the viewed place's own level", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "region",
    });
    expect([...ids]).toEqual(["region"]);
  });

  it("location 'above' adds broader levels and always keeps the current", () => {
    const ids = computeVisibleLevelGroupIds(withLevelMode("city", "above"), {
      kind: "location",
      currentPlaceType: "city",
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("location 'below' adds narrower levels and always keeps the current", () => {
    const ids = computeVisibleLevelGroupIds(withLevelMode("country", "below"), {
      kind: "location",
      currentPlaceType: "country",
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("matches the current group by normalized place type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "CITY",
    });
    expect([...ids]).toEqual(["city"]);
  });

  it("falls back to all groups when the place type belongs to no group", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "continent",
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("falls back to all groups when the place type is null", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: null,
    });
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  describe("visible: false", () => {
    const withHiddenCountry = groups.map(g => (g.id === "country"
      ? {
        ...g,
        visible: false,
      }
      : g));

    it("excludes a hidden group from the main map default", () => {
      const ids = computeVisibleLevelGroupIds(withHiddenCountry, {
        kind: "main",
      });
      expect([...ids].sort()).toEqual(["city"]);
    });

    it("excludes a hidden group from an 'above' expansion that would otherwise include it", () => {
      const ids = computeVisibleLevelGroupIds(withHiddenCountry.map(g => (g.id === "city"
        ? {
          ...g,
          levelMode: "above" as const,
        }
        : g)), {
        kind: "location",
        currentPlaceType: "city",
      });
      expect([...ids].sort()).toEqual(["city", "region"]);
    });

    it("excludes a hidden group from a bookmark 'above' expansion", () => {
      const ids = computeVisibleLevelGroupIds(withHiddenCountry.map(g => (g.id === "city"
        ? {
          ...g,
          levelMode: "above" as const,
        }
        : g)), {
        kind: "bookmark",
        placeTypes: ["city"],
      });
      expect([...ids].sort()).toEqual(["city", "region"]);
    });

    it("excludes a hidden group even as the anchor/current level itself", () => {
      const ids = computeVisibleLevelGroupIds(withHiddenCountry, {
        kind: "location",
        currentPlaceType: "country",
      });
      expect([...ids]).toEqual([]);
    });

    it("excludes a hidden group from the no-anchor fall-back-to-all case", () => {
      const ids = computeVisibleLevelGroupIds(withHiddenCountry, {
        kind: "location",
        currentPlaceType: "continent",
      });
      expect([...ids].sort()).toEqual(["city", "region"]);
    });
  });
});

describe("findAnchorGroup", () => {
  it("returns the group containing the viewed place's normalized type", () => {
    expect(findAnchorGroup(groups, " City ")?.id).toBe("city");
    expect(findAnchorGroup(groups, "state")?.id).toBe("region");
  });

  it("returns undefined for a blank type or a type in no group", () => {
    expect(findAnchorGroup(groups, null)).toBeUndefined();
    expect(findAnchorGroup(groups, "  ")).toBeUndefined();
    expect(findAnchorGroup(groups, "hamlet")).toBeUndefined();
  });
});

describe("computePopulatedLevelGroupIds", () => {
  it("includes groups whose place type is present among the plotted locations", () => {
    const ids = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "country",
      },
      {
        placeType: "city",
      },
    ]);
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("excludes a group narrower than every directly-populated level", () => {
    const ids = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "country",
      },
    ]);
    expect([...ids].sort()).toEqual(["country"]);
  });

  it("includes broader ancestor groups even when only a narrower level is plotted", () => {
    const ids = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "city",
      },
    ]);
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("re-includes a group once a location of its place type appears", () => {
    const before = computePopulatedLevelGroupIds(groups, [{
      placeType: "country",
    }]);
    expect(before.has("region")).toBe(false);
    const after = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "country",
      },
      {
        placeType: "state",
      },
    ]);
    expect(after.has("region")).toBe(true);
  });

  it("returns no ids when there are no plotted locations", () => {
    const ids = computePopulatedLevelGroupIds(groups, []);
    expect(ids.size).toBe(0);
  });
});

describe("resolveVisibleLevelGroupIds", () => {
  it("uses the default set when there is no override, intersected with populated", () => {
    const ids = resolveVisibleLevelGroupIds(
      new Set(["country", "region", "city"]),
      null,
      new Set(["country", "region"]),
    );
    expect([...ids].sort()).toEqual(["country", "region"]);
  });

  it("uses the override set over the default when present, still intersected with populated", () => {
    const ids = resolveVisibleLevelGroupIds(
      new Set(["country"]),
      new Set(["region", "city"]),
      new Set(["country", "region", "city"]),
    );
    expect([...ids].sort()).toEqual(["city", "region"]);
  });

  it("drops ids that are not populated, even when the override includes them", () => {
    const ids = resolveVisibleLevelGroupIds(
      new Set(["country"]),
      new Set(["country", "region", "city"]),
      new Set(["country"]),
    );
    expect([...ids]).toEqual(["country"]);
  });

  it("treats an empty override set as an explicit 'nothing visible' (not a fall-back to default)", () => {
    const ids = resolveVisibleLevelGroupIds(
      new Set(["country", "region"]),
      new Set(),
      new Set(["country", "region"]),
    );
    expect(ids.size).toBe(0);
  });
});

describe("placeTypeChoices", () => {
  it("returns distinct place types as label-sorted choices", () => {
    const choices = placeTypeChoices([
      {
        placeType: "city",
      },
      {
        placeType: "administrative",
      },
      {
        placeType: "city",
      },
    ]);
    expect(choices).toEqual([
      {
        value: "administrative",
        label: "Administrative",
      },
      {
        value: "city",
        label: "City",
      },
    ]);
  });

  it("ignores null and blank place types", () => {
    const choices = placeTypeChoices([
      {
        placeType: null,
      },
      {
        placeType: "   ",
      },
      {
        placeType: "town",
      },
    ]);
    expect(choices).toEqual([{
      value: "town",
      label: "Town",
    }]);
  });

  it("dedupes case-insensitively, keeping the first-seen casing", () => {
    const choices = placeTypeChoices([{
      placeType: "City",
    }, {
      placeType: "city",
    }]);
    expect(choices).toEqual([{
      value: "City",
      label: "City",
    }]);
  });

  it("keeps the current value selectable even when no location carries it", () => {
    const choices = placeTypeChoices([{
      placeType: "city",
    }], "hamlet");
    expect(choices).toEqual([
      {
        value: "city",
        label: "City",
      },
      {
        value: "hamlet",
        label: "Hamlet",
      },
    ]);
  });

  it("preserves the current value's casing over a location's differing casing", () => {
    const choices = placeTypeChoices([{
      placeType: "city",
    }], "City");
    expect(choices).toEqual([{
      value: "City",
      label: "City",
    }]);
  });

  it("humanizes underscored keys for the label", () => {
    const choices = placeTypeChoices([{
      placeType: "state_district",
    }]);
    expect(choices).toEqual([{
      value: "state_district",
      label: "State District",
    }]);
  });
});
