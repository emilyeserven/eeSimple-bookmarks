import type { AutofillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { applyAutofill, matchesRule } from "./autofill";

/** Build an AutofillRule with sensible defaults so tests only specify what matters. */
function rule(overrides: Partial<AutofillRule>): AutofillRule {
  return {
    id: overrides.id ?? "rule",
    name: overrides.name ?? "Rule",
    field: overrides.field ?? "title",
    operator: overrides.operator ?? "contains",
    pattern: overrides.pattern ?? "",
    setCategoryId: overrides.setCategoryId ?? null,
    tagIds: overrides.tagIds ?? [],
    numberValues: overrides.numberValues ?? [],
    booleanValues: overrides.booleanValues ?? [],
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

const input = {
  url: "https://www.101cookbooks.com/weeknight-ponzu-pasta/",
  title: "Weeknight Ponzu Pasta",
};

describe("matchesRule", () => {
  it("matches contains case-insensitively", () => {
    expect(matchesRule(rule({
      field: "title",
      operator: "contains",
      pattern: "ponzu",
    }), input)).toBe(true);
  });

  it("matches starts_with case-insensitively", () => {
    expect(matchesRule(rule({
      field: "title",
      operator: "starts_with",
      pattern: "weeknight",
    }), input)).toBe(true);
    expect(matchesRule(rule({
      field: "title",
      operator: "starts_with",
      pattern: "pasta",
    }), input)).toBe(false);
  });

  it("matches a valid regex and ignores an invalid one", () => {
    expect(matchesRule(rule({
      field: "title",
      operator: "regex",
      pattern: "p(asta|izza)",
    }), input)).toBe(true);
    expect(matchesRule(rule({
      field: "title",
      operator: "regex",
      pattern: "(unclosed",
    }), input)).toBe(false);
  });

  it("matches a domain with the www. prefix stripped", () => {
    expect(matchesRule(rule({
      operator: "domain",
      pattern: "101cookbooks.com",
    }), input)).toBe(true);
    expect(matchesRule(rule({
      operator: "domain",
      pattern: "example.com",
    }), input)).toBe(false);
  });

  it("never matches an empty pattern or an unparseable URL for domain", () => {
    expect(matchesRule(rule({
      operator: "contains",
      pattern: "   ",
    }), input)).toBe(false);
    expect(matchesRule(rule({
      operator: "domain",
      pattern: "101cookbooks.com",
    }), {
      url: "not a url",
      title: "x",
    })).toBe(false);
  });
});

describe("applyAutofill", () => {
  it("unions tags and values across all matching rules", () => {
    const result = applyAutofill(input, [
      rule({
        id: "a",
        operator: "domain",
        pattern: "101cookbooks.com",
        tagIds: ["recipe"],
        booleanValues: [{
          propertyId: "tried",
          value: false,
        }],
      }),
      rule({
        id: "b",
        operator: "contains",
        pattern: "ponzu",
        tagIds: ["japanese", "citrus"],
      }),
      rule({
        id: "c",
        operator: "contains",
        pattern: "pasta",
        tagIds: ["carb-pasta"],
      }),
    ]);
    expect(result.tagIds.sort()).toEqual(["carb-pasta", "citrus", "japanese", "recipe"]);
    expect(result.booleanValues).toEqual([{
      propertyId: "tried",
      value: false,
    }]);
  });

  it("lets the highest sortOrder win for the category and a shared property", () => {
    const result = applyAutofill(input, [
      rule({
        id: "low",
        sortOrder: 0,
        operator: "contains",
        pattern: "ponzu",
        setCategoryId: "cat-a",
        numberValues: [{
          propertyId: "score",
          value: 1,
        }],
      }),
      rule({
        id: "high",
        sortOrder: 10,
        operator: "contains",
        pattern: "pasta",
        setCategoryId: "cat-b",
        numberValues: [{
          propertyId: "score",
          value: 9,
        }],
      }),
    ]);
    expect(result.categoryId).toBe("cat-b");
    expect(result.numberValues).toEqual([{
      propertyId: "score",
      value: 9,
    }]);
  });

  it("returns empty results when nothing matches", () => {
    const result = applyAutofill(input, [
      rule({
        operator: "contains",
        pattern: "nonsense",
        setCategoryId: "cat-a",
      }),
    ]);
    expect(result).toEqual({
      categoryId: null,
      tagIds: [],
      numberValues: [],
      booleanValues: [],
    });
  });
});
