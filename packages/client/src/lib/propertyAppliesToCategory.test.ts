import { propertyAppliesToCategory } from "@eesimple/types";

import { describe, expect, it } from "vitest";

describe("propertyAppliesToCategory", () => {
  it("matches a category listed in categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: false,
      categoryIds: ["a", "b"],
    }, "a")).toBe(true);
  });

  it("does not match a category absent from categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: false,
      categoryIds: ["a"],
    }, "z")).toBe(false);
  });

  it("matches any category when allCategories is set, even one not in categoryIds", () => {
    expect(propertyAppliesToCategory({
      allCategories: true,
      categoryIds: [],
    }, "new-category")).toBe(true);
  });
});
