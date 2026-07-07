import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, DEFAULT_HOMEPAGE_WIDGET_ORDER, resolveHomepageWidgetOrder, RUNTIME_SLUG } from "@eesimple/types";
import {
  asBookmarkAddFormAdvancedRules,
  asBookmarkAddFormPlacements,
  asBreakpoints,
  asCropped,
  asHanScriptLanguage,
  asMapPinScale,
  asMinAreaThreshold,
  asScreenshotDefault,
  normalizePlaceTypeColors,
  normalizePlaceTypeDisplay,
  normalizePlaceTypeIcons,
  normalizePlaceTypeLevelGroups,
  resolveBookmarkAddFormSettings,
  resolvePersonSourceLabels,
} from "@/services/appSettings";

test("asCropped: rounds to a positive integer and falls back on junk", () => {
  assert.equal(asCropped(16, 9), 16);
  assert.equal(asCropped(15.6, 9), 16);
  assert.equal(asCropped(0, 9), 1);
  assert.equal(asCropped(-4, 9), 1);
  assert.equal(asCropped(null, 9), 9);
  assert.equal(asCropped(undefined, 9), 9);
  assert.equal(asCropped(Number.NaN, 9), 9);
  assert.equal(asCropped(Number.POSITIVE_INFINITY, 9), 9);
});

test("asHanScriptLanguage: only 'zh' maps to Chinese, everything else defaults to Japanese", () => {
  assert.equal(asHanScriptLanguage("zh"), "zh");
  assert.equal(asHanScriptLanguage("ja"), "ja");
  assert.equal(asHanScriptLanguage(null), "ja");
  assert.equal(asHanScriptLanguage(undefined), "ja");
  assert.equal(asHanScriptLanguage("en"), "ja");
  assert.equal(asHanScriptLanguage("chinese"), "ja");
});

test("resolvePersonSourceLabels: defaults to website/biography when the row is absent", () => {
  assert.deepEqual(resolvePersonSourceLabels(null), {
    websiteLabel: "website",
    biographyLabel: "biography",
  });
  assert.deepEqual(resolvePersonSourceLabels(undefined), {
    websiteLabel: "website",
    biographyLabel: "biography",
  });
});

test("resolvePersonSourceLabels: merges a partial stored value over the defaults", () => {
  assert.deepEqual(resolvePersonSourceLabels({
    websiteLabel: "Homepage",
  }), {
    websiteLabel: "Homepage",
    biographyLabel: "biography",
  });
  assert.deepEqual(resolvePersonSourceLabels({
    biographyLabel: "Bio",
  }), {
    websiteLabel: "website",
    biographyLabel: "Bio",
  });
});

test("resolvePersonSourceLabels: falls back to the default for blank or non-string values", () => {
  assert.deepEqual(resolvePersonSourceLabels({
    websiteLabel: "   ",
    biographyLabel: "",
  }), {
    websiteLabel: "website",
    biographyLabel: "biography",
  });
  assert.deepEqual(resolvePersonSourceLabels({
    websiteLabel: 42,
    biographyLabel: [],
  }), {
    websiteLabel: "website",
    biographyLabel: "biography",
  });
});

test("asMinAreaThreshold: clamps to non-negative, defaults to 0", () => {
  assert.equal(asMinAreaThreshold(12.5), 12.5);
  assert.equal(asMinAreaThreshold(-3), 0);
  assert.equal(asMinAreaThreshold(null), 0);
  assert.equal(asMinAreaThreshold(Number.NaN), 0);
});

test("asMapPinScale: clamps into the allowed range and defaults to 1", () => {
  assert.equal(asMapPinScale(1), 1);
  assert.equal(asMapPinScale(null), 1);
  assert.equal(asMapPinScale(Number.NaN), 1);
  // Out-of-range values clamp rather than reset.
  assert.equal(asMapPinScale(1000), asMapPinScale(999));
  assert.equal(asMapPinScale(-1000), asMapPinScale(-999));
  assert.ok(asMapPinScale(1000) >= asMapPinScale(-1000));
});

test("asScreenshotDefault: rounds and clamps into [min, max], falls back on junk", () => {
  assert.equal(asScreenshotDefault(500, 1280, 320, 3840), 500);
  assert.equal(asScreenshotDefault(500.4, 1280, 320, 3840), 500);
  assert.equal(asScreenshotDefault(10, 1280, 320, 3840), 320);
  assert.equal(asScreenshotDefault(99999, 1280, 320, 3840), 3840);
  assert.equal(asScreenshotDefault(null, 1280, 320, 3840), 1280);
  assert.equal(asScreenshotDefault(Number.NaN, 1280, 320, 3840), 1280);
});

test("asBreakpoints: dedupes, sorts, rounds and drops non-positive junk", () => {
  assert.deepEqual(asBreakpoints([1024, 768, 768.4]), [768, 1024]);
  assert.deepEqual(asBreakpoints([0, -5, Number.NaN, 640]), [640]);
  // Non-arrays fall back to the default breakpoint list.
  assert.deepEqual(asBreakpoints(null), [768]);
  assert.deepEqual(asBreakpoints(undefined), [768]);
  // An explicitly empty list is respected (user cleared all breakpoints).
  assert.deepEqual(asBreakpoints([]), []);
});

test("normalizePlaceTypeDisplay: keeps well-formed entries, coercing visible/sortOrder", () => {
  const out = normalizePlaceTypeDisplay({
    city: {
      displayMode: "pin",
      visible: false,
      sortOrder: 3,
      color: "#a1b2c3",
    },
    country: {
      displayMode: "area",
    },
  });
  assert.deepEqual(out.city, {
    displayMode: "pin",
    visible: false,
    sortOrder: 3,
    color: "#a1b2c3",
  });
  // Absent visible defaults to true, absent sortOrder to 0, no color key when invalid/absent.
  assert.deepEqual(out.country, {
    displayMode: "area",
    visible: true,
    sortOrder: 0,
  });
});

test("normalizePlaceTypeDisplay: drops malformed keys/values and non-object input", () => {
  assert.deepEqual(normalizePlaceTypeDisplay(null), {});
  assert.deepEqual(normalizePlaceTypeDisplay("junk"), {});
  const out = normalizePlaceTypeDisplay({
    "": {
      displayMode: "pin",
    },
    "city": null,
    "town": {
      displayMode: "bogus-mode",
    },
    "village": {
      displayMode: "pin",
      sortOrder: Number.NaN,
    },
  });
  assert.deepEqual(Object.keys(out), ["village"]);
  assert.equal(out.village.sortOrder, 0);
});

test("normalizePlaceTypeLevelGroups: sanitizes groups and fills defaults", () => {
  const out = normalizePlaceTypeLevelGroups([
    {
      id: "g1",
      name: "  Cities  ",
      displayMode: "pin",
      placeTypes: ["city", "city", "", 42, "town"],
      visible: false,
      sortOrder: 7,
    },
    {
      // Missing id/name → synthesized id from index, empty name; sortOrder falls back to index.
      displayMode: "area",
    },
    {
      // Invalid displayMode → dropped entirely.
      id: "bad",
      displayMode: "nope",
    },
    "junk",
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].id, "g1");
  assert.equal(out[0].name, "Cities");
  assert.deepEqual(out[0].placeTypes, ["city", "town"]);
  // `visible` is retired → always stored true, regardless of the input value.
  assert.equal(out[0].visible, true);
  // showOnMainMap absent → follows the legacy `visible` (false here) for pre-showOnMainMap back-compat.
  assert.equal(out[0].showOnMainMap, false);
  assert.equal(out[0].sortOrder, 7);
  assert.equal(out[1].id, "group-1");
  assert.equal(out[1].name, "");
  assert.equal(out[1].visible, true);
  assert.equal(out[1].showOnMainMap, true);
  assert.equal(out[1].sortOrder, 1);
});

test("normalizePlaceTypeLevelGroups: sanitizes defaultHiddenGroupIds to a deduped string array", () => {
  const out = normalizePlaceTypeLevelGroups([
    {
      id: "g1",
      name: "Cities",
      displayMode: "area",
      placeTypes: ["city"],
      defaultHiddenGroupIds: ["country", "country", "", 42, "region"],
    },
    {
      // Absent → empty array.
      id: "g2",
      name: "Regions",
      displayMode: "area",
    },
  ]);
  assert.deepEqual(out[0].defaultHiddenGroupIds, ["country", "region"]);
  assert.deepEqual(out[1].defaultHiddenGroupIds, []);
});

test("normalizePlaceTypeLevelGroups: non-array input yields an empty config", () => {
  assert.deepEqual(normalizePlaceTypeLevelGroups(null), []);
  assert.deepEqual(normalizePlaceTypeLevelGroups({}), []);
});

test("normalizePlaceTypeIcons: keeps only valid key/icon pairs", () => {
  const out = normalizePlaceTypeIcons({
    "city": "MapPin",
    "": "MapPin",
    "town": 42,
    "village": "",
  });
  assert.deepEqual(Object.keys(out), ["city"]);
  assert.deepEqual(normalizePlaceTypeIcons(null), {});
  assert.deepEqual(normalizePlaceTypeIcons(["MapPin"]), {});
});

test("normalizePlaceTypeColors: keeps only valid hex colors", () => {
  const out = normalizePlaceTypeColors({
    "city": "#abc",
    "town": "#a1b2c3",
    "village": "red",
    "hamlet": 7,
    "": "#abc",
  });
  assert.deepEqual(Object.keys(out).sort(), ["city", "town"]);
  assert.deepEqual(normalizePlaceTypeColors(null), {});
  assert.deepEqual(normalizePlaceTypeColors([]), {});
});

test("asBookmarkAddFormPlacements: keeps only string keys with a valid placement value", () => {
  const out = asBookmarkAddFormPlacements({
    [RUNTIME_SLUG]: "default",
    "page-progress": "advanced",
    "junk-placement": "bogus",
    "junk-number": 42,
    "": "hidden",
  });
  assert.deepEqual(out, {
    [RUNTIME_SLUG]: "default",
    "page-progress": "advanced",
  });
});

test("asBookmarkAddFormPlacements: non-object / array / null input yields an empty map", () => {
  assert.deepEqual(asBookmarkAddFormPlacements(null), {});
  assert.deepEqual(asBookmarkAddFormPlacements(undefined), {});
  assert.deepEqual(asBookmarkAddFormPlacements("junk"), {});
  assert.deepEqual(asBookmarkAddFormPlacements(["default"]), {});
});

test("resolveBookmarkAddFormSettings: falls back to defaults when the row/columns are absent or null", () => {
  assert.deepEqual(resolveBookmarkAddFormSettings(), DEFAULT_BOOKMARK_ADD_FORM_SETTINGS);
  assert.deepEqual(resolveBookmarkAddFormSettings(null), DEFAULT_BOOKMARK_ADD_FORM_SETTINGS);
  assert.deepEqual(
    resolveBookmarkAddFormSettings({
      bookmarkFormAdvancedFields: null,
      bookmarkFormHiddenFields: null,
      bookmarkFormBuiltInPlacements: null,
      bookmarkFormStandardPlacements: null,
    }),
    DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
  );
});

test("resolveBookmarkAddFormSettings: standardFieldPlacements merges stored values over the defaults", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormStandardPlacements: {
      // An explicit "default" (main area) is a real value, not an absence.
      categoryId: "default",
      title: "hidden",
    },
    bookmarkFormBuiltInPlacements: null,
  });
  // Explicit stored placements win...
  assert.equal(out.standardFieldPlacements.categoryId, "default");
  assert.equal(out.standardFieldPlacements.title, "hidden");
  // ...while an untouched field keeps its default (a newly-added field stays hidden).
  assert.equal(out.standardFieldPlacements.mediaTypeId, "advanced");
  assert.equal(out.standardFieldPlacements.locationIds, "hidden");
});

test("resolveBookmarkAddFormSettings: an empty stored standard map resolves to the defaults", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormStandardPlacements: {},
    bookmarkFormBuiltInPlacements: null,
  });
  assert.deepEqual(out.standardFieldPlacements, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements);
});

test("resolveBookmarkAddFormSettings: derives the standard map from legacy arrays for a pre-existing row", () => {
  // A row saved under the old model (no new column) keeps its choices for the original nine fields,
  // while a newer field (absent from both legacy arrays) takes its default (hidden).
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormAdvancedFields: ["categoryId"],
    bookmarkFormHiddenFields: ["mediaTypeId"],
    bookmarkFormBuiltInPlacements: null,
    bookmarkFormStandardPlacements: null,
  });
  assert.equal(out.standardFieldPlacements.categoryId, "advanced");
  assert.equal(out.standardFieldPlacements.mediaTypeId, "hidden");
  // A legacy field absent from both arrays meant the main area.
  assert.equal(out.standardFieldPlacements.languageId, "default");
  // A newer field never existed in the legacy model → its default (hidden).
  assert.equal(out.standardFieldPlacements.locationIds, "hidden");
});

test("resolveBookmarkAddFormSettings: builtInPropertyPlacements merges stored values over the defaults", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormBuiltInPlacements: {
      [RUNTIME_SLUG]: "default",
    },
    bookmarkFormStandardPlacements: null,
  });
  // The overridden slug takes the stored value...
  assert.equal(out.builtInPropertyPlacements[RUNTIME_SLUG], "default");
  // ...while a slug missing from the stored map still resolves to its default ("hidden").
  assert.equal(out.builtInPropertyPlacements["page-progress"], "hidden");
});

test("resolveBookmarkAddFormSettings: junk entries in the stored placements map are dropped before merging", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormBuiltInPlacements: {
      [RUNTIME_SLUG]: "bogus-placement",
    },
    bookmarkFormStandardPlacements: null,
  });
  // The junk value is dropped, so the slug falls back to its default rather than the bogus string.
  assert.equal(out.builtInPropertyPlacements[RUNTIME_SLUG], "hidden");
});

test("resolveHomepageWidgetOrder: non-array / junk input falls back to the default order", () => {
  assert.deepEqual(resolveHomepageWidgetOrder(null), DEFAULT_HOMEPAGE_WIDGET_ORDER);
  assert.deepEqual(resolveHomepageWidgetOrder(undefined), DEFAULT_HOMEPAGE_WIDGET_ORDER);
  assert.deepEqual(resolveHomepageWidgetOrder("junk"), DEFAULT_HOMEPAGE_WIDGET_ORDER);
  assert.deepEqual(resolveHomepageWidgetOrder({}), DEFAULT_HOMEPAGE_WIDGET_ORDER);
  // Only unknown/duplicate values → nothing recognized, so the default order is used.
  assert.deepEqual(resolveHomepageWidgetOrder(["nope", 42, null]), DEFAULT_HOMEPAGE_WIDGET_ORDER);
});

test("resolveHomepageWidgetOrder: keeps saved order, dedupes, and appends missing widgets", () => {
  // A fully-specified custom order is preserved verbatim.
  assert.deepEqual(
    resolveHomepageWidgetOrder(["search", "bookmarkQuickAdd", "homepageText"]),
    ["search", "bookmarkQuickAdd", "homepageText"],
  );
  // Duplicates and unknown keys are dropped; missing known widgets are appended in default order.
  assert.deepEqual(
    resolveHomepageWidgetOrder(["search", "search", "bogus"]),
    ["search", "homepageText", "bookmarkQuickAdd"],
  );
  // A partial order keeps the saved leader and appends the rest.
  assert.deepEqual(
    resolveHomepageWidgetOrder(["bookmarkQuickAdd"]),
    ["bookmarkQuickAdd", "homepageText", "search"],
  );
});

test("bookmark-add-form update round-trip: the stored shape built by the update path resolves back to the same settings", () => {
  const input = {
    standardFieldPlacements: {
      "categoryId": "default" as const,
      "mediaTypeId": "hidden" as const,
      "not-a-real-field": "bogus" as unknown as "hidden",
    },
    builtInPropertyPlacements: {
      [RUNTIME_SLUG]: "default" as const,
      "not-a-real-slug": "bogus" as unknown as "hidden",
    },
  };
  // Mirrors the storage shape built by updateBookmarkAddFormSettings without touching the DB.
  const stored = {
    bookmarkFormStandardPlacements: asBookmarkAddFormPlacements(input.standardFieldPlacements),
    bookmarkFormBuiltInPlacements: asBookmarkAddFormPlacements(input.builtInPropertyPlacements),
  };
  const resolved = resolveBookmarkAddFormSettings(stored);
  // The valid standard-field overrides round-trip...
  assert.equal(resolved.standardFieldPlacements.categoryId, "default");
  assert.equal(resolved.standardFieldPlacements.mediaTypeId, "hidden");
  // ...the junk field key never made it into storage...
  assert.equal(Object.hasOwn(stored.bookmarkFormStandardPlacements, "not-a-real-field"), false);
  // ...an untouched field keeps its default...
  assert.equal(resolved.standardFieldPlacements.languageId, DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements.languageId);
  // ...the valid built-in override round-trips...
  assert.equal(resolved.builtInPropertyPlacements[RUNTIME_SLUG], "default");
  // ...the junk slug never made it into storage...
  assert.equal(Object.hasOwn(stored.bookmarkFormBuiltInPlacements, "not-a-real-slug"), false);
  // ...and every other built-in slug still resolves to its default.
  for (const slug of Object.keys(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements)) {
    if (slug === RUNTIME_SLUG) continue;
    assert.equal(
      resolved.builtInPropertyPlacements[slug],
      DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.builtInPropertyPlacements[slug],
    );
  }
});

test("resolveBookmarkAddFormSettings: revealAutofilledInMain defaults to false and round-trips a stored value", () => {
  // Absent column → false (today's behavior, unchanged for existing rows).
  assert.equal(
    resolveBookmarkAddFormSettings({
      bookmarkFormStandardPlacements: null,
      bookmarkFormBuiltInPlacements: null,
    }).revealAutofilledInMain,
    false,
  );
  assert.equal(resolveBookmarkAddFormSettings().revealAutofilledInMain, false);
  // A stored true value round-trips.
  assert.equal(
    resolveBookmarkAddFormSettings({
      bookmarkFormStandardPlacements: null,
      bookmarkFormBuiltInPlacements: null,
      bookmarkFormRevealAutofilledInMain: true,
    }).revealAutofilledInMain,
    true,
  );
});

test("resolveBookmarkAddFormSettings: advancedRules defaults to [] and round-trips stored rules", () => {
  // Absent column → empty list (unchanged for existing rows).
  assert.deepEqual(resolveBookmarkAddFormSettings().advancedRules, []);
  assert.deepEqual(
    resolveBookmarkAddFormSettings({
      bookmarkFormStandardPlacements: null,
      bookmarkFormBuiltInPlacements: null,
    }).advancedRules,
    [],
  );
  const rule = {
    id: "r1",
    name: "Books",
    conditions: {
      type: "group",
      combinator: "and",
      children: [],
    },
    standardFieldPlacements: {
      image: "default",
    },
    propertyPlacements: {
      "page-progress": "advanced",
    },
    sortOrder: 2,
  };
  const resolved = resolveBookmarkAddFormSettings({
    bookmarkFormStandardPlacements: null,
    bookmarkFormBuiltInPlacements: null,
    bookmarkFormAdvancedRules: [rule],
  });
  assert.equal(resolved.advancedRules.length, 1);
  assert.deepEqual(resolved.advancedRules[0], rule);
});

test("asBookmarkAddFormAdvancedRules: drops malformed entries and coerces bad fields", () => {
  const out = asBookmarkAddFormAdvancedRules([
    // Missing id → dropped.
    {
      conditions: {
        type: "group",
        combinator: "and",
        children: [],
      },
    },
    // Bad conditions + junk placement values → coerced to an empty tree + dropped placements.
    {
      id: "ok",
      conditions: "not-a-tree",
      standardFieldPlacements: {
        image: "default",
        junk: "nope",
      },
      propertyPlacements: {
        "page-progress": "hidden",
      },
      sortOrder: "5",
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "ok");
  assert.deepEqual(out[0].conditions, {
    type: "group",
    combinator: "and",
    children: [],
  });
  assert.deepEqual(out[0].standardFieldPlacements, {
    image: "default",
  });
  assert.deepEqual(out[0].propertyPlacements, {
    "page-progress": "hidden",
  });
  // A non-numeric sortOrder falls back to the entry index (0 here).
  assert.equal(out[0].sortOrder, 0);
});

test("asBookmarkAddFormAdvancedRules: non-array input yields an empty list", () => {
  assert.deepEqual(asBookmarkAddFormAdvancedRules(null), []);
  assert.deepEqual(asBookmarkAddFormAdvancedRules(undefined), []);
  assert.deepEqual(asBookmarkAddFormAdvancedRules("junk"), []);
  assert.deepEqual(asBookmarkAddFormAdvancedRules({}), []);
});
