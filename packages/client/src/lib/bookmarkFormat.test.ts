import type { CustomProperty } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { formatNumber } from "./bookmarkFormat";

const NOW = "2026-06-01T00:00:00.000Z";

function property(overrides: Partial<CustomProperty>): CustomProperty {
  return {
    id: "prop",
    name: "Prop",
    type: "number",
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    operandPropertyIds: [],
    categoryIds: [],
    showInForm: false,
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
});
