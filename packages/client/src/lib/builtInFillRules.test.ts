// @vitest-environment node
import type { Website } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBuiltInFillRules } from "./builtInFillRules";

type SiteFields = Pick<Website, "category" | "tagIds" | "mediaTypeId" | "scanUrlForIsbn" | "alternateNames">;

/** Minimal website with the fields the built-in rules reflect; nothing configured by default. */
function site(overrides: Partial<SiteFields> = {}): SiteFields {
  return {
    category: null,
    tagIds: [],
    mediaTypeId: null,
    scanUrlForIsbn: false,
    alternateNames: [],
    ...overrides,
  };
}

const ctx = {
  tagNameById: (id: string) => ({
    "tag-1": "React",
    "tag-2": "TypeScript",
  } as Record<string, string>)[id],
  mediaTypeNameById: (id: string) => ({
    "mt-book": "Book",
  } as Record<string, string>)[id],
};

function ruleById(website: SiteFields, id: string) {
  return buildBuiltInFillRules(website, ctx).find(rule => rule.id === id);
}

describe("buildBuiltInFillRules", () => {
  it("returns nothing when the site has no built-in rule configured", () => {
    expect(buildBuiltInFillRules(site(), ctx)).toEqual([]);
  });

  it("includes ISBN only when the site opted into URL ISBN scanning", () => {
    expect(ruleById(site({
      scanUrlForIsbn: true,
    }), "isbn")).toBeDefined();
    expect(ruleById(site({
      scanUrlForIsbn: false,
    }), "isbn")).toBeUndefined();
  });

  it("includes a default only when configured, showing the resolved name as detail", () => {
    const configured = site({
      category: {
        id: "cat-1",
        name: "Development",
        slug: "development",
        icon: null,
      },
      mediaTypeId: "mt-book",
    });
    expect(ruleById(configured, "default-category")?.detail).toBe("Development");
    expect(ruleById(configured, "default-media-type")?.detail).toBe("Book");
    // Absent (not "Not set") when unconfigured.
    expect(ruleById(site(), "default-category")).toBeUndefined();
    expect(ruleById(site(), "default-media-type")).toBeUndefined();
  });

  it("joins resolved default-tag names and omits the rule when none resolve", () => {
    expect(ruleById(site({
      tagIds: ["tag-1", "tag-2"],
    }), "default-tags")?.detail).toBe("React, TypeScript");
    // No resolvable names → no rule at all (not a blank one).
    expect(ruleById(site({
      tagIds: ["tag-missing"],
    }), "default-tags")).toBeUndefined();
  });

  it("includes title-suffix removal only when the site has alternate names", () => {
    expect(ruleById(site({
      alternateNames: ["GH", "GitHub Docs"],
    }), "alternate-names")?.detail).toBe("GH, GitHub Docs");
    expect(ruleById(site(), "alternate-names")).toBeUndefined();
  });

  it("orders the active rules: ISBN, defaults, then title-suffix removal", () => {
    const rules = buildBuiltInFillRules(site({
      scanUrlForIsbn: true,
      category: {
        id: "cat-1",
        name: "Development",
        slug: "development",
        icon: null,
      },
      tagIds: ["tag-1"],
      mediaTypeId: "mt-book",
      alternateNames: ["GH"],
    }), ctx);
    expect(rules.map(rule => rule.id)).toEqual([
      "isbn",
      "default-category",
      "default-tags",
      "default-media-type",
      "alternate-names",
    ]);
  });
});
