import { describe, expect, it } from "vitest";

import { placeTypeChoices } from "./locationLevels";

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
