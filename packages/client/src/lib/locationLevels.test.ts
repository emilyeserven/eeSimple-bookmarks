import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { computePopulatedLevelGroupIds, computeVisibleLevelGroupIds, placeTypeChoices } from "./locationLevels";

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

// Country (0) → Region (1) → City (2), most-general first.
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

describe("computeVisibleLevelGroupIds", () => {
  it("main scope shows only the groups flagged for the main map", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "main",
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country"]);
  });

  it("main scope treats a missing showOnMainMap as shown (legacy default)", () => {
    const legacy = groups.map(g => ({
      ...g,
      showOnMainMap: undefined,
    }));
    const ids = computeVisibleLevelGroupIds(legacy, {
      kind: "main",
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark 'current' shows only the groups containing a tagged location's type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["region"],
    }, "current");
    expect([...ids]).toEqual(["region"]);
  });

  it("bookmark scope anchors on every tagged location's place type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["country", "city"],
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country"]);
  });

  it("bookmark 'above' adds levels broader than the broadest anchor", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["city"],
    }, "above");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark 'below' adds levels narrower than the narrowest anchor", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["country"],
    }, "below");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark scope falls back to all groups when no tagged location's type belongs to a group", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: ["continent"],
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("bookmark scope falls back to all groups when there are no tagged locations", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
      placeTypes: [],
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("location 'current' shows only the viewed place's own level", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "region",
    }, "current");
    expect([...ids]).toEqual(["region"]);
  });

  it("location 'above' adds broader levels and always keeps the current", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "city",
    }, "above");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("location 'below' adds narrower levels and always keeps the current", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "country",
    }, "below");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("matches the current group by normalized place type", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "CITY",
    }, "current");
    expect([...ids]).toEqual(["city"]);
  });

  it("falls back to all groups when the place type belongs to no group", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: "continent",
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });

  it("falls back to all groups when the place type is null", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "location",
      currentPlaceType: null,
    }, "current");
    expect([...ids].sort()).toEqual(["city", "country", "region"]);
  });
});

describe("computePopulatedLevelGroupIds", () => {
  it("includes only groups whose place type is present among the plotted locations", () => {
    const ids = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "country",
      },
      {
        placeType: "city",
      },
    ]);
    expect([...ids].sort()).toEqual(["city", "country"]);
  });

  it("excludes a group with no plotted locations of its place types", () => {
    const ids = computePopulatedLevelGroupIds(groups, [
      {
        placeType: "country",
      },
    ]);
    expect([...ids].sort()).toEqual(["country"]);
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
