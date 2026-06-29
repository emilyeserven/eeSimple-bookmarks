import type { Bookmark, CardDisplayRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildTagDescendants, defaultCardZoneLayouts, emptyCardFieldZones } from "@eesimple/types";

import { bookmarkToConditionInput, inspectBookmarkRules, resolveCardDisplay } from "./cardDisplayRules";

/** Build a Bookmark so tests only specify the fields that matter. */
function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "b1",
    url: "https://example.com/post",
    originalUrl: null,
    title: "Example",
    romanizedTitle: null,
    description: null,
    image: null,
    screenshot: null,
    imageAutoGrabError: null,
    categoryId: "cat-1",
    website: null,
    mediaType: null,
    youtubeChannel: null,
    newsletter: null,
    import: null,
    tags: [],
    blacklistedTagIds: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    fileValues: [],
    choicesValues: [],
    progressValues: [],
    sectionsValues: [],
    textValues: [],
    authors: [],
    relationships: [],
    publisher: null,
    priority: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a CardDisplayRule with sensible (all-inherit) defaults. */
function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "r1",
    name: "Rule",
    slug: "rule",
    description: null,
    conditions: {
      type: "group",
      combinator: "and",
      children: [],
    },
    sortOrder: 0,
    isDefault: false,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const DEFAULT_RULE = makeRule({
  id: "default",
  name: "Default",
  isDefault: true,
  sortOrder: 1_000_000,
  fieldZones: emptyCardFieldZones(),
  cardZoneLayouts: defaultCardZoneLayouts(),
  imageMode: "natural",
  imageVisibility: "shown",
  imageLayout: "above",
  hideWebsiteForYouTube: false,
});

const noTagDescendants = buildTagDescendants([]);

describe("bookmarkToConditionInput", () => {
  it("populates every field from the bookmark", () => {
    const input = bookmarkToConditionInput(makeBookmark({
      categoryId: "cat-9",
      tags: [{
        id: "t1",
        name: "T1",
        slug: "t1",
        parentId: null,
      }],
      youtubeChannel: {
        id: "ch-1",
        name: "Ch",
        slug: "ch",
        imageUrl: null,
      },
      mediaType: {
        id: "mt-1",
        name: "Video",
        slug: "video",
        icon: null,
        parentId: null,
      },
      numberValues: [{
        propertyId: "p-num",
        value: 5,
      }],
      booleanValues: [{
        propertyId: "p-bool",
        value: true,
      }],
      dateTimeValues: [{
        propertyId: "p-dt",
        value: "2026-01-01",
      }],
      fileValues: [{
        propertyId: "p-file",
        url: "u",
        contentType: "image/webp",
        byteSize: 1,
        originalFilename: null,
        width: null,
        height: null,
      }],
    }));

    expect(input.categoryId).toBe("cat-9");
    expect(input.tagIds.has("t1")).toBe(true);
    expect(input.youtubeChannelId).toBe("ch-1");
    expect(input.mediaTypeId).toBe("mt-1");
    expect(input.numberValues.get("p-num")).toBe(5);
    expect(input.booleanValues.get("p-bool")).toBe(true);
    expect(input.dateTimeValues.get("p-dt")).toBe("2026-01-01");
    expect(input.fileValues.has("p-file")).toBe(true);
  });
});

describe("resolveCardDisplay — layered merge", () => {
  it("falls back to the Default rule when nothing else matches", () => {
    const rule = makeRule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["other"],
        }],
      },
      imageMode: "square",
    });
    const resolved = resolveCardDisplay(makeBookmark(), [rule, DEFAULT_RULE], noTagDescendants);
    expect(resolved.imageMode).toBe("natural");
    expect(resolved.provenance.matchedRuleIds).toEqual(["default"]);
  });

  it("the highest-priority matching rule wins each attribute it sets", () => {
    const high = makeRule({
      id: "high",
      sortOrder: 0,
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["cat-1"],
        }],
      },
      fieldZones: {
        ...emptyCardFieldZones(),
        "card-labels": [{
          key: "category",
        }],
      },
    });
    const low = makeRule({
      id: "low",
      sortOrder: 1,
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["cat-1"],
        }],
      },
      imageMode: "square",
      fieldZones: emptyCardFieldZones(),
    });

    const resolved = resolveCardDisplay(makeBookmark(), [high, low, DEFAULT_RULE], noTagDescendants);
    // `high` supplies fieldZones; `low` supplies imageMode; Default fills the rest.
    expect(resolved.fieldZones["card-labels"]).toEqual([{
      key: "category",
    }]);
    expect(resolved.provenance.source.fieldZones).toBe("high");
    expect(resolved.imageMode).toBe("square");
    expect(resolved.provenance.source.imageMode).toBe("low");
    expect(resolved.imageVisibility).toBe("shown");
    expect(resolved.provenance.source.imageVisibility).toBe("default");
  });

  it("a matching rule supplies hideWebsiteForYouTube, else the Default applies", () => {
    const rule = makeRule({
      id: "yt",
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["cat-1"],
        }],
      },
      hideWebsiteForYouTube: true,
    });
    const match = resolveCardDisplay(makeBookmark(), [rule, DEFAULT_RULE], noTagDescendants);
    expect(match.hideWebsiteForYouTube).toBe(true);
    expect(match.provenance.source.hideWebsiteForYouTube).toBe("yt");

    const noMatch = resolveCardDisplay(
      makeBookmark({
        categoryId: "other",
      }),
      [rule, DEFAULT_RULE],
      noTagDescendants,
    );
    expect(noMatch.hideWebsiteForYouTube).toBe(false);
    expect(noMatch.provenance.source.hideWebsiteForYouTube).toBe("default");
  });

  it("a matching rule supplies cardZoneLayouts, else the Default applies", () => {
    const gridded = defaultCardZoneLayouts();
    gridded["card-labels"] = {
      mode: "grid",
    };
    const rule = makeRule({
      id: "layout",
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["cat-1"],
        }],
      },
      cardZoneLayouts: gridded,
    });
    const match = resolveCardDisplay(makeBookmark(), [rule, DEFAULT_RULE], noTagDescendants);
    expect(match.cardZoneLayouts["card-labels"].mode).toBe("grid");
    expect(match.provenance.source.cardZoneLayouts).toBe("layout");

    const noMatch = resolveCardDisplay(
      makeBookmark({
        categoryId: "other",
      }),
      [rule, DEFAULT_RULE],
      noTagDescendants,
    );
    expect(noMatch.cardZoneLayouts["card-labels"].mode).toBe("flex");
    expect(noMatch.provenance.source.cardZoneLayouts).toBe("default");
  });

  it("an empty condition tree never matches a non-default rule", () => {
    const empty = makeRule({
      id: "empty",
      imageMode: "square",
    });
    const resolved = resolveCardDisplay(makeBookmark(), [empty, DEFAULT_RULE], noTagDescendants);
    expect(resolved.imageMode).toBe("natural");
    expect(resolved.provenance.matchedRuleIds).toEqual(["default"]);
  });

  it("matches via tag cascade (a parent-tag rule matches a child-tagged bookmark)", () => {
    const tagDescendants = buildTagDescendants([
      {
        id: "parent",
        parentId: null,
      },
      {
        id: "child",
        parentId: "parent",
      },
    ]);
    const rule = makeRule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "tag",
          tagIds: ["parent"],
        }],
      },
      imageVisibility: "off",
    });
    const bookmark = makeBookmark({
      tags: [{
        id: "child",
        name: "Child",
        slug: "child",
        parentId: "parent",
      }],
    });
    const resolved = resolveCardDisplay(bookmark, [rule, DEFAULT_RULE], tagDescendants);
    expect(resolved.imageVisibility).toBe("off");
  });
});

describe("inspectBookmarkRules", () => {
  const catCondition = (categoryId: string) => ({
    type: "group" as const,
    combinator: "and" as const,
    children: [{
      type: "category" as const,
      categoryIds: [categoryId],
    }],
  });

  it("flags a lower rule's attribute as overridden by the higher rule that won it", () => {
    const high = makeRule({
      id: "high",
      sortOrder: 0,
      conditions: catCondition("cat-1"),
      imageMode: "square",
    });
    const low = makeRule({
      id: "low",
      sortOrder: 1,
      conditions: catCondition("cat-1"),
      imageMode: "cropped",
    });

    const result = inspectBookmarkRules(makeBookmark(), [high, low, DEFAULT_RULE], noTagDescendants);

    const highInspection = result.rules.find(r => r.rule.id === "high");
    const lowInspection = result.rules.find(r => r.rule.id === "low");

    expect(highInspection?.matched).toBe(true);
    expect(highInspection?.attrs).toContainEqual(expect.objectContaining({
      key: "imageMode",
      status: "applied",
      overriddenBy: null,
    }));

    expect(lowInspection?.matched).toBe(true);
    expect(lowInspection?.attrs).toContainEqual(expect.objectContaining({
      key: "imageMode",
      status: "overridden",
      overriddenBy: "high",
    }));
  });

  it("marks a rule whose conditions don't match as not matched, still reporting its set attrs", () => {
    const rule = makeRule({
      id: "other",
      conditions: catCondition("nope"),
      imageMode: "square",
    });

    const result = inspectBookmarkRules(makeBookmark(), [rule, DEFAULT_RULE], noTagDescendants);
    const inspection = result.rules.find(r => r.rule.id === "other");

    expect(inspection?.matched).toBe(false);
    // It sets imageMode but the Default supplied the resolved value, so it reads as overridden.
    expect(inspection?.attrs).toContainEqual(expect.objectContaining({
      key: "imageMode",
      status: "overridden",
      overriddenBy: "default",
    }));
  });

  it("reports the Default rule's attributes as applied when nothing else matches", () => {
    const result = inspectBookmarkRules(makeBookmark(), [DEFAULT_RULE], noTagDescendants);
    const defaultInspection = result.rules.find(r => r.rule.id === "default");

    expect(defaultInspection?.matched).toBe(true);
    expect(defaultInspection?.attrs.every(attr => attr.status === "applied")).toBe(true);
    expect(result.resolved.imageMode).toBe("natural");
  });
});
