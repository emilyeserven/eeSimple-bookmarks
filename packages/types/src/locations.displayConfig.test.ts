import assert from "node:assert/strict";
import { test } from "node:test";

import type { LocationBoundary, PlaceTypeColorConfig, PlaceTypeDisplayConfig, PlaceTypeIconConfig, PlaceTypeLevelGroupConfig } from "./locations.js";

import {
  boundaryAreaKm2,
  distributePaletteColors,
  expandLevelGroupsToDisplayConfig,
  locationLacksLevel,
  normalizeHexColor,
  normalizeIconName,
  normalizeLevelMode,
  placeTypeKey,
  placeTypeOrder,
  resolveLocationColor,
  resolveLocationDisplay,
  resolveLocationIcon,
  resolveLocationPlaceTypeColor,
} from "./locations.js";

const POLYGON: LocationBoundary = {
  type: "Polygon",
  coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]],
};

// --- placeTypeKey ---

test("placeTypeKey normalizes case and whitespace, mapping null/blank to empty", () => {
  assert.equal(placeTypeKey("City"), "city");
  assert.equal(placeTypeKey("  State  "), "state");
  assert.equal(placeTypeKey(null), "");
  assert.equal(placeTypeKey("   "), "");
  assert.equal(placeTypeKey(undefined), "");
});

// --- resolveLocationDisplay ---

test("resolveLocationDisplay treats an unconfigured place type as legacy area-or-pin", () => {
  const config: PlaceTypeDisplayConfig = {};
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: POLYGON,
  }, config), "area");
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: null,
  }, config), "pin");
  assert.equal(resolveLocationDisplay({
    placeType: null,
  }, config), "pin");
});

test("resolveLocationDisplay honors an explicit pin default even when a boundary exists", () => {
  const config: PlaceTypeDisplayConfig = {
    city: {
      displayMode: "pin",
      visible: true,
      sortOrder: 0,
    },
  };
  assert.equal(resolveLocationDisplay({
    placeType: "City",
    boundary: POLYGON,
  }, config), "pin");
});

test("resolveLocationDisplay falls back to a pin when an area default has no boundary", () => {
  const config: PlaceTypeDisplayConfig = {
    city: {
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
  };
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: null,
  }, config), "pin");
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: POLYGON,
  }, config), "area");
});

test("resolveLocationDisplay hides a place type toggled invisible regardless of mode/boundary", () => {
  const config: PlaceTypeDisplayConfig = {
    state: {
      displayMode: "area",
      visible: false,
      sortOrder: 0,
    },
  };
  assert.equal(resolveLocationDisplay({
    placeType: "state",
    boundary: POLYGON,
  }, config), "hidden");
  assert.equal(resolveLocationDisplay({
    placeType: "state",
    boundary: null,
  }, config), "hidden");
});

test("resolveLocationDisplay downgrades a tiny area to a pin when it's below minAreaKm2", () => {
  const config: PlaceTypeDisplayConfig = {};
  // A ~1 degree square near the equator is on the order of 10,000+ km^2 — well above a 1 km^2 floor.
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: POLYGON,
  }, config, 1), "area");
  // A tiny sliver of a boundary (roughly 0.0001 degrees square) is far below a 1 km^2 floor.
  const tinyBoundary: LocationBoundary = {
    type: "Polygon",
    coordinates: [[[0, 0], [0, 0.0001], [0.0001, 0.0001], [0.0001, 0], [0, 0]]],
  };
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: tinyBoundary,
  }, config, 1), "pin");
  // minAreaKm2 defaults to 0 (disabled) — the tiny boundary still renders as an area.
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: tinyBoundary,
  }, config), "area");
});

test("resolveLocationDisplay ignores minAreaKm2 for pin-mode levels and levels with no boundary", () => {
  const pinConfig: PlaceTypeDisplayConfig = {
    city: {
      displayMode: "pin",
      visible: true,
      sortOrder: 0,
    },
  };
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: POLYGON,
  }, pinConfig, 1_000_000), "pin");
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: null,
  }, {}, 1), "pin");
});

// --- boundaryAreaKm2 ---

test("boundaryAreaKm2 computes a positive area for a Polygon and sums a MultiPolygon's parts", () => {
  const area = boundaryAreaKm2(POLYGON);
  assert.ok(area > 0);
  const multi: LocationBoundary = {
    type: "MultiPolygon",
    coordinates: [POLYGON.coordinates as number[][][], POLYGON.coordinates as number[][][]],
  };
  assert.ok(Math.abs(boundaryAreaKm2(multi) - area * 2) < 1e-6);
});

test("boundaryAreaKm2 subtracts hole rings from the outer ring", () => {
  const withHole: LocationBoundary = {
    type: "Polygon",
    coordinates: [
      [[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]],
      [[0.5, 0.5], [0.5, 1.5], [1.5, 1.5], [1.5, 0.5], [0.5, 0.5]],
    ],
  };
  const noHole: LocationBoundary = {
    type: "Polygon",
    coordinates: [(withHole.coordinates as number[][][])[0]],
  };
  assert.ok(boundaryAreaKm2(withHole) < boundaryAreaKm2(noHole));
});

// --- placeTypeOrder ---

test("placeTypeOrder prefers the configured sortOrder", () => {
  const config: PlaceTypeDisplayConfig = {
    city: {
      displayMode: "area",
      visible: true,
      sortOrder: 3,
    },
  };
  assert.equal(placeTypeOrder("city", config), 3);
});

test("placeTypeOrder falls back to the canonical rank, then sorts unknown types last", () => {
  const config: PlaceTypeDisplayConfig = {};
  // country precedes city in the canonical order.
  assert.ok(placeTypeOrder("country", config) < placeTypeOrder("city", config));
  assert.equal(placeTypeOrder("not-a-real-type", config), Number.MAX_SAFE_INTEGER);
});

// --- expandLevelGroupsToDisplayConfig ---

test("expandLevelGroupsToDisplayConfig spreads each group's setting to its members", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "g1",
      name: "Country",
      placeTypes: ["Country", "  State  "],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
    {
      id: "g2",
      name: "City",
      placeTypes: ["city", "town"],
      displayMode: "pin",
      visible: false,
      sortOrder: 1,
    },
  ];
  const config = expandLevelGroupsToDisplayConfig(groups);
  // keys are normalized
  assert.deepEqual(config.country, {
    displayMode: "area",
    visible: true,
    sortOrder: 0,
  });
  assert.deepEqual(config.state, {
    displayMode: "area",
    visible: true,
    sortOrder: 0,
  });
  assert.deepEqual(config.city, {
    displayMode: "pin",
    visible: false,
    sortOrder: 1,
  });
  assert.equal(config.town?.sortOrder, 1);
});

test("expandLevelGroupsToDisplayConfig ignores blank members and leaves unassigned types absent", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "g1",
      name: "Region",
      placeTypes: ["region", "  ", ""],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
  ];
  const config = expandLevelGroupsToDisplayConfig(groups);
  assert.deepEqual(Object.keys(config), ["region"]);
  // an unassigned type still resolves to the legacy default
  assert.equal(resolveLocationDisplay({
    placeType: "city",
    boundary: null,
  }, config), "pin");
});

// --- normalizeHexColor ---

test("normalizeHexColor accepts #rgb/#rrggbb (lowercased) and rejects everything else", () => {
  assert.equal(normalizeHexColor("#FFF"), "#fff");
  assert.equal(normalizeHexColor("  #3388FF  "), "#3388ff");
  assert.equal(normalizeHexColor("#12ab"), null);
  assert.equal(normalizeHexColor("red"), null);
  assert.equal(normalizeHexColor(null), null);
  assert.equal(normalizeHexColor(123), null);
});

// --- color: expand + resolve ---

test("expandLevelGroupsToDisplayConfig carries a valid color and drops an invalid one", () => {
  const config = expandLevelGroupsToDisplayConfig([
    {
      id: "g1",
      name: "Country",
      placeTypes: ["country"],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
      color: "#EF4444",
    },
    {
      id: "g2",
      name: "City",
      placeTypes: ["city"],
      displayMode: "pin",
      visible: true,
      sortOrder: 1,
      color: "not-a-color",
    },
  ]);
  assert.equal(config.country?.color, "#ef4444");
  assert.equal("color" in (config.city ?? {}), false);
});

test("resolveLocationColor returns the placeType's color or null when unset", () => {
  const config = expandLevelGroupsToDisplayConfig([
    {
      id: "g1",
      name: "Country",
      placeTypes: ["country"],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
      color: "#22c55e",
    },
  ]);
  assert.equal(resolveLocationColor({
    placeType: "Country",
  }, config), "#22c55e");
  assert.equal(resolveLocationColor({
    placeType: "city",
  }, config), null);
});

// --- resolveLocationPlaceTypeColor ---

test("resolveLocationPlaceTypeColor returns the placeType's override (key-normalized) or null", () => {
  const colors: PlaceTypeColorConfig = {
    city: "#ef4444",
    country: "#22c55e",
  };
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: "City",
  }, colors), "#ef4444");
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: "  country  ",
  }, colors), "#22c55e");
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: "state",
  }, colors), null);
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: null,
  }, colors), null);
});

test("resolveLocationPlaceTypeColor re-normalizes the stored value, ignoring a malformed entry", () => {
  const colors: PlaceTypeColorConfig = {
    city: "#ABC",
    town: "not-a-color",
  };
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: "city",
  }, colors), "#abc");
  assert.equal(resolveLocationPlaceTypeColor({
    placeType: "town",
  }, colors), null);
});

// --- normalizeIconName ---

test("normalizeIconName trims a usable name and rejects empty/over-long/non-string values", () => {
  assert.equal(normalizeIconName("  Star  "), "Star");
  assert.equal(normalizeIconName("BookOpen"), "BookOpen");
  assert.equal(normalizeIconName("   "), null);
  assert.equal(normalizeIconName(""), null);
  assert.equal(normalizeIconName("x".repeat(65)), null);
  assert.equal(normalizeIconName(null), null);
  assert.equal(normalizeIconName(42), null);
});

// --- normalizeLevelMode ---

test("normalizeLevelMode keeps a valid mode and falls back to 'current' otherwise", () => {
  assert.equal(normalizeLevelMode("above"), "above");
  assert.equal(normalizeLevelMode("current"), "current");
  assert.equal(normalizeLevelMode("below"), "below");
  assert.equal(normalizeLevelMode("sideways"), "current");
  assert.equal(normalizeLevelMode(null), "current");
  assert.equal(normalizeLevelMode(undefined), "current");
  assert.equal(normalizeLevelMode(42), "current");
});

// --- resolveLocationIcon ---

test("resolveLocationIcon returns the placeType's icon (key-normalized) or null when unset", () => {
  const icons: PlaceTypeIconConfig = {
    city: "Building2",
    country: "Flag",
  };
  assert.equal(resolveLocationIcon({
    placeType: "City",
  }, icons), "Building2");
  assert.equal(resolveLocationIcon({
    placeType: "  country  ",
  }, icons), "Flag");
  assert.equal(resolveLocationIcon({
    placeType: "state",
  }, icons), null);
  assert.equal(resolveLocationIcon({
    placeType: null,
  }, icons), null);
});

test("expandLevelGroupsToDisplayConfig lets the lowest-sortOrder group win a shared place type", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "low",
      name: "Low",
      placeTypes: ["city"],
      displayMode: "pin",
      visible: true,
      sortOrder: 5,
    },
    {
      id: "high",
      name: "High",
      placeTypes: ["city"],
      displayMode: "area",
      visible: false,
      sortOrder: 2,
    },
  ];
  const config = expandLevelGroupsToDisplayConfig(groups);
  assert.deepEqual(config.city, {
    displayMode: "area",
    visible: false,
    sortOrder: 2,
  });
});

// --- locationLacksLevel ---

test("locationLacksLevel flags a non-null placeType absent from the config, key-normalized", () => {
  const config: PlaceTypeDisplayConfig = {
    country: {
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
  };
  assert.equal(locationLacksLevel({
    placeType: "City",
  }, config), true);
  assert.equal(locationLacksLevel({
    placeType: "  Country  ",
  }, config), false);
});

test("locationLacksLevel treats a null/blank placeType as 'no place type', not 'no level'", () => {
  const config: PlaceTypeDisplayConfig = {};
  assert.equal(locationLacksLevel({
    placeType: null,
  }, config), false);
});

// --- distributePaletteColors ---

test("distributePaletteColors spreads count evenly across the full gradient", () => {
  const colors = Array.from({
    length: 20,
  }, (_, i) => `c${i}`);
  // 4 groups against 20 stops should land near 0, 6/7, 13, 19 — spanning the full range, not bunched
  // at the start.
  assert.deepEqual(distributePaletteColors(colors, 4), ["c0", "c6", "c13", "c19"]);
  assert.deepEqual(distributePaletteColors(colors, 1), ["c0"]);
  assert.deepEqual(distributePaletteColors(colors, 20), colors);
  assert.deepEqual(distributePaletteColors(colors, 0), []);
});

test("distributePaletteColors reverses which end of the gradient the first group gets", () => {
  const colors = Array.from({
    length: 20,
  }, (_, i) => `c${i}`);
  assert.deepEqual(distributePaletteColors(colors, 4, true), ["c19", "c13", "c6", "c0"]);
});

test("distributePaletteColors handles a single-color palette and an empty palette", () => {
  assert.deepEqual(distributePaletteColors(["solo"], 3), ["solo", "solo", "solo"]);
  assert.deepEqual(distributePaletteColors([], 5), []);
});
