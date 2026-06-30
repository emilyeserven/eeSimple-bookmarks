import type { PlaceTypeLevelGroup } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { computeVisibleLevelGroupIds, placeTypeChoices } from "./locationLevels";

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

  it("bookmark scope always shows every group regardless of mode", () => {
    const ids = computeVisibleLevelGroupIds(groups, {
      kind: "bookmark",
    }, "above");
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
