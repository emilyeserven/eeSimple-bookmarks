import type { AutofillRule, ConditionTree, InboxItem, Website } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { computeInboxPrefillSeed } from "./inboxPrefillSeed";

/** A single-match AND tree on the URL/title. */
function match(pattern: string, field: "url" | "title" = "title"): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children: [{
      type: "match",
      field,
      operator: "contains",
      pattern,
    }],
  };
}

function rule(overrides: Partial<AutofillRule>): AutofillRule {
  return {
    id: "rule",
    name: "Rule",
    slug: "rule",
    description: null,
    conditions: match("ponzu"),
    setCategoryId: null,
    setMediaTypeId: null,
    tagIds: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function item(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: "item",
    url: "https://www.101cookbooks.com/weeknight-ponzu-pasta/",
    title: "Weeknight Ponzu Pasta",
    categoryId: null,
    ...overrides,
  } as InboxItem;
}

function website(overrides: Partial<Website> = {}): Website {
  return {
    id: "site",
    domain: "101cookbooks.com",
    siteName: "101 Cookbooks",
    ...overrides,
  } as Website;
}

describe("computeInboxPrefillSeed", () => {
  it("seeds category/media-type/tags from matching autofill rules", () => {
    const seed = computeInboxPrefillSeed(item(), {
      autofillRules: [rule({
        conditions: match("ponzu"),
        setCategoryId: "cat-recipe",
        setMediaTypeId: "mt-article",
        tagIds: ["recipe", "japanese"],
      })],
      websites: [],
    });
    expect(seed.categoryId).toBe("cat-recipe");
    expect(seed.mediaTypeId).toBe("mt-article");
    expect(seed.tagIds?.sort()).toEqual(["japanese", "recipe"]);
  });

  it("merges website defaults and unions their tags with rule tags", () => {
    const seed = computeInboxPrefillSeed(item(), {
      autofillRules: [rule({
        conditions: match("ponzu"),
        tagIds: ["recipe"],
      })],
      websites: [website({
        category: {
          id: "cat-site",
          name: "Cooking",
          slug: "cooking",
          icon: null,
        },
        mediaTypeId: "mt-site",
        tagIds: ["from-site"],
      })],
    });
    expect(seed.categoryId).toBe("cat-site");
    expect(seed.mediaTypeId).toBe("mt-site");
    expect(seed.tagIds?.sort()).toEqual(["from-site", "recipe"]);
  });

  it("keeps the item's existing category (import/newsletter default) over website and rules", () => {
    const seed = computeInboxPrefillSeed(item({
      categoryId: "cat-import",
    }), {
      autofillRules: [rule({
        conditions: match("ponzu"),
        setCategoryId: "cat-rule",
      })],
      websites: [website({
        category: {
          id: "cat-site",
          name: "Cooking",
          slug: "cooking",
          icon: null,
        },
      })],
    });
    expect(seed.categoryId).toBe("cat-import");
  });

  it("leaves fields empty when nothing matches", () => {
    const seed = computeInboxPrefillSeed(item({
      url: "https://example.com/unrelated",
      title: "Nothing here",
    }), {
      autofillRules: [rule({
        conditions: match("ponzu"),
        setCategoryId: "cat-recipe",
      })],
      websites: [],
    });
    expect(seed.categoryId).toBeUndefined();
    expect(seed.mediaTypeId).toBeUndefined();
    expect(seed.tagIds).toEqual([]);
  });
});
