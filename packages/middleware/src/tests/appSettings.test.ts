import assert from "node:assert/strict";
import { test } from "node:test";

import {
  asBreakpoints,
  asCropped,
  asMapPinScale,
  asMinAreaThreshold,
  asScreenshotDefault,
  normalizePlaceTypeColors,
  normalizePlaceTypeDisplay,
  normalizePlaceTypeIcons,
  normalizePlaceTypeLevelGroups,
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
  assert.equal(out[0].visible, false);
  // showOnMainMap absent → follows visible.
  assert.equal(out[0].showOnMainMap, false);
  assert.equal(out[0].sortOrder, 7);
  assert.equal(out[1].id, "group-1");
  assert.equal(out[1].name, "");
  assert.equal(out[1].visible, true);
  assert.equal(out[1].showOnMainMap, true);
  assert.equal(out[1].sortOrder, 1);
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
