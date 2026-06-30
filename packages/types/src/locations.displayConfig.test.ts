import assert from "node:assert/strict";
import { test } from "node:test";

import type { LocationBoundary, PlaceTypeDisplayConfig, PlaceTypeLevelGroupConfig } from "./locations.js";

import {
  expandLevelGroupsToDisplayConfig,
  normalizeHexColor,
  placeTypeKey,
  placeTypeOrder,
  resolveLocationColor,
  resolveLocationDisplay,
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
