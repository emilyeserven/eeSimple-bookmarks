import type { AutofillRule, ConditionMatchField, ConditionMatchOperator, ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { applyAutofill, matchesRule } from "./autofill";

/** A single-match AND tree, the common case. */
function match(
  pattern: string,
  options?: { field?: ConditionMatchField;
    operator?: ConditionMatchOperator; },
): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [{
      type: "match",
      field: options?.field ?? "title",
      operator: options?.operator ?? "contains",
      pattern,
    }],
  };
}

/** Build an AutofillRule with sensible defaults so tests only specify what matters. */
function rule(overrides: Partial<AutofillRule>): AutofillRule {
  return {
    id: overrides.id ?? "rule",
    name: overrides.name ?? "Rule",
    slug: overrides.slug ?? "rule",
    description: overrides.description ?? null,
    conditions: overrides.conditions ?? match(""),
    setCategoryId: overrides.setCategoryId ?? null,
    setMediaTypeId: overrides.setMediaTypeId ?? null,
    tagIds: overrides.tagIds ?? [],
    numberValues: overrides.numberValues ?? [],
    booleanValues: overrides.booleanValues ?? [],
    dateTimeValues: overrides.dateTimeValues ?? [],
    sortOrder: overrides.sortOrder ?? 0,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00.000Z",
  };
}

const input = {
  url: "https://www.101cookbooks.com/weeknight-ponzu-pasta/",
  title: "Weeknight Ponzu Pasta",
};

describe("matchesRule", () => {
  it("matches contains and starts_with case-insensitively", () => {
    expect(matchesRule(rule({
      conditions: match("ponzu"),
    }), input)).toBe(true);
    expect(matchesRule(rule({
      conditions: match("weeknight", {
        operator: "starts_with",
      }),
    }), input)).toBe(true);
    expect(matchesRule(rule({
      conditions: match("pasta", {
        operator: "starts_with",
      }),
    }), input)).toBe(false);
  });

  it("matches a valid regex and ignores an invalid one", () => {
    expect(matchesRule(rule({
      conditions: match("p(asta|izza)", {
        operator: "regex",
      }),
    }), input)).toBe(true);
    expect(matchesRule(rule({
      conditions: match("(unclosed", {
        operator: "regex",
      }),
    }), input)).toBe(false);
  });

  it("matches a domain with the www. prefix stripped", () => {
    expect(matchesRule(rule({
      conditions: match("101cookbooks.com", {
        operator: "domain",
      }),
    }), input)).toBe(true);
    expect(matchesRule(rule({
      conditions: match("example.com", {
        operator: "domain",
      }),
    }), input)).toBe(false);
  });

  it("matches a website condition by the bookmark's host", () => {
    expect(matchesRule(rule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "website",
          domains: ["example.com", "101cookbooks.com"],
        }],
      },
    }), input)).toBe(true);
    expect(matchesRule(rule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "website",
          domains: ["example.com"],
        }],
      },
    }), input)).toBe(false);
  });

  it("does not fire category/tag/property leaves at add-time, but an OR match leaf still can", () => {
    // Category leaf alone can't match (no category is known yet).
    expect(matchesRule(rule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["cat-a"],
        }],
      },
    }), input)).toBe(false);
    // An OR group still fires through its satisfiable match leaf.
    expect(matchesRule(rule({
      conditions: {
        type: "group",
        combinator: "or",
        children: [
          {
            type: "category",
            categoryIds: ["cat-a"],
          },
          {
            type: "match",
            field: "title",
            operator: "contains",
            pattern: "ponzu",
          },
        ],
      },
    }), input)).toBe(true);
  });
});

describe("applyAutofill", () => {
  it("unions tags and values across all matching rules", () => {
    const result = applyAutofill(input, [
      rule({
        id: "a",
        conditions: match("101cookbooks.com", {
          operator: "domain",
        }),
        tagIds: ["recipe"],
        booleanValues: [{
          propertyId: "tried",
          value: false,
        }],
      }),
      rule({
        id: "b",
        conditions: match("ponzu"),
        tagIds: ["japanese", "citrus"],
      }),
      rule({
        id: "c",
        conditions: match("pasta"),
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
        conditions: match("ponzu"),
        setCategoryId: "cat-a",
        numberValues: [{
          propertyId: "score",
          value: 1,
        }],
      }),
      rule({
        id: "high",
        sortOrder: 10,
        conditions: match("pasta"),
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

  it("applies a matching rule's date/time values", () => {
    const result = applyAutofill(input, [
      rule({
        conditions: match("ponzu"),
        setCategoryId: "cat-a",
        dateTimeValues: [{
          propertyId: "published",
          value: "2026-06-15",
        }],
      }),
    ]);
    expect(result.dateTimeValues).toEqual([{
      propertyId: "published",
      value: "2026-06-15",
    }]);
  });

  it("returns empty results when nothing matches", () => {
    const result = applyAutofill(input, [
      rule({
        conditions: match("nonsense"),
        setCategoryId: "cat-a",
      }),
    ]);
    expect(result).toEqual({
      categoryId: null,
      mediaTypeId: null,
      tagIds: [],
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [],
    });
  });

  it("lets the highest sortOrder win for the media type", () => {
    const result = applyAutofill(input, [
      rule({
        id: "low",
        sortOrder: 0,
        conditions: match("ponzu"),
        setMediaTypeId: "mt-a",
      }),
      rule({
        id: "high",
        sortOrder: 10,
        conditions: match("pasta"),
        setMediaTypeId: "mt-b",
      }),
    ]);
    expect(result.mediaTypeId).toBe("mt-b");
  });
});
