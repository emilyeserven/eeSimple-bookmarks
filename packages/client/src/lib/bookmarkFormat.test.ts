import type { CustomProperty } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { formatNumber } from "./bookmarkFormat";

const NOW = "2026-06-01T00:00:00.000Z";

function property(overrides: Partial<CustomProperty>): CustomProperty {
  return {
    id: "prop",
    name: "Prop",
    type: "number",
    description: null,
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    valuePrefix: null,
    zeroLabel: null,
    maxLabel: null,
    operandPropertyIds: [],
    categoryIds: [],
    showInForm: false,
    advancedOnly: false,
    showInListings: true,
    createdAt: NOW,
    ...overrides,
  };
}

describe("formatNumber", () => {
  it("returns the bare value when the property has no units", () => {
    expect(formatNumber(5, property({}))).toBe("5");
  });

  it("uses the singular unit for a value of one", () => {
    expect(formatNumber(1, property({
      unitSingular: "star",
      unitPlural: "stars",
    }))).toBe("1 star");
  });

  it("uses the plural unit for a value other than one", () => {
    expect(formatNumber(3, property({
      unitSingular: "star",
      unitPlural: "stars",
    }))).toBe("3 stars");
  });

  it("falls back to whichever unit is defined", () => {
    expect(formatNumber(2, property({
      unitSingular: "point",
    }))).toBe("2 point");
    expect(formatNumber(1, property({
      unitPlural: "points",
    }))).toBe("1 points");
  });

  it("prepends the value prefix, with and without a unit", () => {
    expect(formatNumber(5, property({
      valuePrefix: "$",
    }))).toBe("$5");
    expect(formatNumber(5, property({
      valuePrefix: "$",
      unitPlural: "each",
    }))).toBe("$5 each");
  });

  it("shows the zero label for a value of zero, ignoring prefix and unit", () => {
    expect(formatNumber(0, property({
      zeroLabel: "Free",
      valuePrefix: "$",
      unitPlural: "dollars",
    }))).toBe("Free");
  });

  it("shows the bare value at zero when no zero label is set", () => {
    expect(formatNumber(0, property({
      valuePrefix: "$",
    }))).toBe("$0");
  });

  it("shows the max label once the value reaches the maximum", () => {
    expect(formatNumber(5, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("Unlimited");
    expect(formatNumber(7, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("Unlimited");
  });

  it("does not apply the max label below the maximum or when no maximum is set", () => {
    expect(formatNumber(4, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("4");
    expect(formatNumber(5, property({
      maxLabel: "Unlimited",
    }))).toBe("5");
  });
});
