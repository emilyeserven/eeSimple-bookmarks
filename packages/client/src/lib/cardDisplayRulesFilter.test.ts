import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  ruleReferencesCategory,
  ruleReferencesMediaType,
  ruleReferencesProperty,
  ruleReferencesTag,
  ruleReferencesWebsite,
  ruleReferencesYoutubeChannel,
  seedCardDisplayConditions,
} from "./cardDisplayRulesFilter";

/** Build a CardDisplayRule with all-inherit defaults; tests override only `conditions`. */
function makeRule(conditions: ConditionTree): CardDisplayRule {
  return {
    id: "r1",
    name: "Rule",
    description: null,
    conditions,
    sortOrder: 0,
    isDefault: false,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function group(...children: ConditionTree["children"]): ConditionTree {
  return {
    type: "group",
    combinator: "and",
    children,
  };
}

describe("ruleReferences* predicates", () => {
  it("matches a category leaf, including nested in a sub-group", () => {
    const direct = makeRule(group({
      type: "category",
      categoryIds: ["cat-1", "cat-2"],
    }));
    const nested = makeRule(group(group({
      type: "category",
      categoryIds: ["cat-2"],
    })));
    expect(ruleReferencesCategory(direct, "cat-1")).toBe(true);
    expect(ruleReferencesCategory(nested, "cat-2")).toBe(true);
    expect(ruleReferencesCategory(direct, "cat-9")).toBe(false);
  });

  it("matches a website leaf by normalized domain", () => {
    const rule = makeRule(group({
      type: "website",
      domains: ["www.Example.com"],
    }));
    expect(ruleReferencesWebsite(rule, "example.com")).toBe(true);
    expect(ruleReferencesWebsite(rule, "other.com")).toBe(false);
  });

  it("matches tag / media-type / youtube-channel / property leaves", () => {
    expect(ruleReferencesTag(makeRule(group({
      type: "tag",
      tagIds: ["t1"],
    })), "t1")).toBe(true);
    expect(ruleReferencesMediaType(makeRule(group({
      type: "media-type",
      mediaTypeIds: ["m1"],
    })), "m1")).toBe(true);
    expect(ruleReferencesYoutubeChannel(makeRule(group({
      type: "youtube-channel",
      channelIds: ["c1"],
    })), "c1")).toBe(true);
    expect(ruleReferencesProperty(makeRule(group({
      type: "property",
      propertyId: "p1",
      predicate: {
        valueKind: "boolean",
        predicate: {
          kind: "presence",
          mode: "has",
        },
      },
    })), "p1")).toBe(true);
  });

  it("does not match an empty tree", () => {
    const empty = makeRule(group());
    expect(ruleReferencesCategory(empty, "cat-1")).toBe(false);
    expect(ruleReferencesProperty(empty, "p1")).toBe(false);
  });
});

describe("seedCardDisplayConditions", () => {
  it("seeds one leaf per scope id", () => {
    expect(seedCardDisplayConditions({
      categoryId: "cat-1",
    }).children).toEqual([{
      type: "category",
      categoryIds: ["cat-1"],
    }]);
    expect(seedCardDisplayConditions({
      websiteDomain: "example.com",
    }).children).toEqual([{
      type: "website",
      domains: ["example.com"],
    }]);
    expect(seedCardDisplayConditions({
      tagId: "t1",
    }).children).toEqual([{
      type: "tag",
      tagIds: ["t1"],
    }]);
  });

  it("seeds a well-typed presence predicate for a property scope", () => {
    const tree = seedCardDisplayConditions({
      property: {
        id: "p1",
        valueKind: "number",
      },
    });
    expect(tree.children).toEqual([{
      type: "property",
      propertyId: "p1",
      predicate: {
        valueKind: "number",
        predicate: {
          kind: "presence",
          mode: "has",
        },
      },
    }]);
  });

  it("returns an empty tree when no scope is set", () => {
    expect(seedCardDisplayConditions({}).children).toEqual([]);
  });
});
