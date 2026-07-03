import assert from "node:assert/strict";
import { test } from "node:test";

import { DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, RUNTIME_SLUG } from "@eesimple/types";
import {
  asBookmarkAddFormPlacements,
  asBreakpoints,
  asCropped,
  asMapPinScale,
  asMinAreaThreshold,
  asScreenshotDefault,
  normalizePlaceTypeColors,
  normalizePlaceTypeDisplay,
  normalizePlaceTypeIcons,
  normalizePlaceTypeLevelGroups,
  resolveBookmarkAddFormSettings,
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
    }),
    DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
  );
});

test("resolveBookmarkAddFormSettings: a stored empty array is a valid value, not a fallback trigger", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormAdvancedFields: [],
    bookmarkFormHiddenFields: [],
    bookmarkFormBuiltInPlacements: null,
  });
  assert.deepEqual(out.advancedFields, []);
  assert.deepEqual(out.hiddenFields, []);
  // Confirm the default list is genuinely non-empty, so this is a real behavioral difference.
  assert.ok(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.advancedFields.length > 0);
});

test("resolveBookmarkAddFormSettings: builtInPropertyPlacements merges stored values over the defaults", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormAdvancedFields: null,
    bookmarkFormHiddenFields: null,
    bookmarkFormBuiltInPlacements: {
      [RUNTIME_SLUG]: "default",
    },
  });
  // The overridden slug takes the stored value...
  assert.equal(out.builtInPropertyPlacements[RUNTIME_SLUG], "default");
  // ...while a slug missing from the stored map still resolves to its default ("hidden").
  assert.equal(out.builtInPropertyPlacements["page-progress"], "hidden");
});

test("resolveBookmarkAddFormSettings: junk entries in the stored placements map are dropped before merging", () => {
  const out = resolveBookmarkAddFormSettings({
    bookmarkFormAdvancedFields: null,
    bookmarkFormHiddenFields: null,
    bookmarkFormBuiltInPlacements: {
      [RUNTIME_SLUG]: "bogus-placement",
    },
  });
  // The junk value is dropped, so the slug falls back to its default rather than the bogus string.
  assert.equal(out.builtInPropertyPlacements[RUNTIME_SLUG], "hidden");
});

test("bookmark-add-form update round-trip: the stored shape built by the update path resolves back to the same settings", () => {
  const input = {
    advancedFields: ["categoryId"],
    hiddenFields: ["mediaTypeId"],
    builtInPropertyPlacements: {
      [RUNTIME_SLUG]: "default" as const,
      "not-a-real-slug": "bogus" as unknown as "hidden",
    },
  };
  // Mirrors the storage shape built by updateBookmarkAddFormSettings without touching the DB.
  const stored = {
    bookmarkFormAdvancedFields: [...input.advancedFields],
    bookmarkFormHiddenFields: [...input.hiddenFields],
    bookmarkFormBuiltInPlacements: asBookmarkAddFormPlacements(input.builtInPropertyPlacements),
  };
  const resolved = resolveBookmarkAddFormSettings(stored);
  assert.deepEqual(resolved.advancedFields, input.advancedFields);
  assert.deepEqual(resolved.hiddenFields, input.hiddenFields);
  // The valid override round-trips...
  assert.equal(resolved.builtInPropertyPlacements[RUNTIME_SLUG], "default");
  // ...the junk key never made it into storage...
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
