import type { ConditionInput, ConditionNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildTagDescendants, emptyConditionTree, evaluateConditions } from "@eesimple/types";

/** Build a ConditionInput so tests only specify what matters. */
function makeInput(overrides: Partial<ConditionInput> = {}): ConditionInput {
  return {
    url: overrides.url ?? "https://www.101cookbooks.com/weeknight-ponzu-pasta/",
    title: overrides.title ?? "Weeknight Ponzu Pasta",
    categoryId: overrides.categoryId ?? "cat-recipes",
    tagIds: overrides.tagIds ?? new Set<string>(),
    numberValues: overrides.numberValues ?? new Map<string, number>(),
    booleanValues: overrides.booleanValues ?? new Map<string, boolean>(),
    dateTimeValues: overrides.dateTimeValues ?? new Map<string, string>(),
  };
}

describe("evaluateConditions — match leaf", () => {
  const input = makeInput();

  it("matches contains/starts_with case-insensitively", () => {
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "PONZU",
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "weeknight",
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "pasta",
    }, input)).toBe(false);
  });

  it("matches a valid regex and ignores an invalid one", () => {
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "p(asta|izza)",
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "(unclosed",
    }, input)).toBe(false);
  });

  it("strips www. for domain and ignores the field", () => {
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "domain",
      pattern: "101cookbooks.com",
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "match",
      field: "url",
      operator: "domain",
      pattern: "example.com",
    }, input)).toBe(false);
  });

  it("never matches a blank pattern", () => {
    expect(evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "   ",
    }, input)).toBe(false);
  });
});

describe("evaluateConditions — category leaf", () => {
  it("matches when the bookmark's category is listed", () => {
    const input = makeInput({
      categoryId: "cat-a",
    });
    expect(evaluateConditions({
      type: "category",
      categoryIds: ["cat-a", "cat-b"],
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "category",
      categoryIds: ["cat-b"],
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "category",
      categoryIds: [],
    }, input)).toBe(false);
  });
});

describe("evaluateConditions — website leaf", () => {
  const input = makeInput(); // host: 101cookbooks.com (www. stripped)

  it("matches the bookmark host, stripping www. and ignoring case/extra domains", () => {
    expect(evaluateConditions({
      type: "website",
      domains: ["example.com", "101cookbooks.com"],
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "website",
      domains: ["WWW.101CookBooks.com"],
    }, input)).toBe(true);
  });

  it("does not match an unrelated domain or an empty list", () => {
    expect(evaluateConditions({
      type: "website",
      domains: ["example.com"],
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "website",
      domains: [],
    }, input)).toBe(false);
  });

  it("never matches when the URL can't be parsed", () => {
    expect(evaluateConditions({
      type: "website",
      domains: ["101cookbooks.com"],
    }, makeInput({
      url: "not a url",
    }))).toBe(false);
  });
});

describe("evaluateConditions — tag leaf with cascade", () => {
  const tagDescendants = buildTagDescendants([
    {
      id: "food",
      parentId: null,
    },
    {
      id: "japanese",
      parentId: "food",
    },
    {
      id: "ramen",
      parentId: "japanese",
    },
    {
      id: "drinks",
      parentId: null,
    },
  ]);

  it("matches a descendant when a parent tag is selected", () => {
    const input = makeInput({
      tagIds: new Set(["ramen"]),
    });
    expect(evaluateConditions({
      type: "tag",
      tagIds: ["food"],
    }, input, {
      tagDescendants,
    })).toBe(true);
  });

  it("does not cascade without a resolver", () => {
    const input = makeInput({
      tagIds: new Set(["ramen"]),
    });
    expect(evaluateConditions({
      type: "tag",
      tagIds: ["food"],
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "tag",
      tagIds: ["ramen"],
    }, input)).toBe(true);
  });

  it("does not match an unrelated branch", () => {
    const input = makeInput({
      tagIds: new Set(["ramen"]),
    });
    expect(evaluateConditions({
      type: "tag",
      tagIds: ["drinks"],
    }, input, {
      tagDescendants,
    })).toBe(false);
  });

  it("never matches an empty selection", () => {
    expect(evaluateConditions({
      type: "tag",
      tagIds: [],
    }, makeInput({
      tagIds: new Set(["ramen"]),
    }), {
      tagDescendants,
    })).toBe(false);
  });
});

describe("evaluateConditions — property leaf", () => {
  it("evaluates a number range inclusively and respects open bounds", () => {
    const input = makeInput({
      numberValues: new Map([["rating", 4]]),
    });
    expect(evaluateConditions({
      type: "property",
      propertyId: "rating",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "range",
          min: 3,
          max: 5,
        },
      },
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "property",
      propertyId: "rating",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "range",
          min: 5,
          max: null,
        },
      },
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "property",
      propertyId: "rating",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "range",
          min: null,
          max: 4,
        },
      },
    }, input)).toBe(true);
  });

  it("evaluates number presence", () => {
    const has = makeInput({
      numberValues: new Map([["rating", 0]]),
    });
    const missing = makeInput();
    expect(evaluateConditions({
      type: "property",
      propertyId: "rating",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "presence",
          mode: "has",
        },
      },
    }, has)).toBe(true);
    expect(evaluateConditions({
      type: "property",
      propertyId: "rating",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "presence",
          mode: "missing",
        },
      },
    }, missing)).toBe(true);
  });

  it("evaluates a datetime range inclusively and respects open bounds", () => {
    const input = makeInput({
      dateTimeValues: new Map([["due", "2026-06-15"]]),
    });
    expect(evaluateConditions({
      type: "property",
      propertyId: "due",
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "range",
          from: "2026-06-01",
          to: "2026-06-30",
        },
      },
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "property",
      propertyId: "due",
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "range",
          from: "2026-07-01",
          to: null,
        },
      },
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "property",
      propertyId: "due",
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "range",
          from: null,
          to: "2026-06-15",
        },
      },
    }, input)).toBe(true);
  });

  it("evaluates datetime presence", () => {
    const has = makeInput({
      dateTimeValues: new Map([["due", "2026-06-15"]]),
    });
    expect(evaluateConditions({
      type: "property",
      propertyId: "due",
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "presence",
          mode: "has",
        },
      },
    }, has)).toBe(true);
    expect(evaluateConditions({
      type: "property",
      propertyId: "due",
      predicate: {
        valueKind: "datetime",
        predicate: {
          kind: "presence",
          mode: "missing",
        },
      },
    }, makeInput())).toBe(true);
  });

  it("evaluates boolean value and presence", () => {
    const input = makeInput({
      booleanValues: new Map([["tried", true]]),
    });
    expect(evaluateConditions({
      type: "property",
      propertyId: "tried",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "value",
          value: true,
        },
      },
    }, input)).toBe(true);
    expect(evaluateConditions({
      type: "property",
      propertyId: "tried",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "value",
          value: false,
        },
      },
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "property",
      propertyId: "tried",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "presence",
          mode: "missing",
        },
      },
    }, makeInput())).toBe(true);
  });
});

describe("evaluateConditions — groups and nesting", () => {
  const input = makeInput({
    categoryId: "cat-a",
    tagIds: new Set(["ramen"]),
  });

  it("AND requires every child; OR requires some", () => {
    const matchPonzu = {
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "ponzu",
    } satisfies ConditionNode;
    const wrongCategory = {
      type: "category",
      categoryIds: ["cat-z"],
    } satisfies ConditionNode;

    expect(evaluateConditions({
      type: "group",
      combinator: "and",
      children: [matchPonzu, wrongCategory],
    }, input)).toBe(false);
    expect(evaluateConditions({
      type: "group",
      combinator: "or",
      children: [matchPonzu, wrongCategory],
    }, input)).toBe(true);
  });

  it("an empty group matches nothing", () => {
    expect(evaluateConditions(emptyConditionTree(), input)).toBe(false);
    expect(evaluateConditions({
      type: "group",
      combinator: "or",
      children: [],
    }, input)).toBe(false);
  });

  it("evaluates a nested group", () => {
    expect(evaluateConditions({
      type: "group",
      combinator: "and",
      children: [
        {
          type: "category",
          categoryIds: ["cat-a"],
        },
        {
          type: "group",
          combinator: "or",
          children: [
            {
              type: "match",
              field: "title",
              operator: "contains",
              pattern: "nope",
            },
            {
              type: "match",
              field: "title",
              operator: "contains",
              pattern: "pasta",
            },
          ],
        },
      ],
    }, input)).toBe(true);
  });
});
