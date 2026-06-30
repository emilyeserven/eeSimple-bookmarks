import assert from "node:assert/strict";
import { test } from "node:test";

import type { LocationBoundary, PlaceTypeDisplayConfig } from "./locations.js";

import {
  placeTypeKey,
  placeTypeOrder,
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
