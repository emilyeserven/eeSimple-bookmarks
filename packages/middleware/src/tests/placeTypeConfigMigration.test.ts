import assert from "node:assert/strict";
import { test } from "node:test";
import type { PlaceTypeDisplayConfig, PlaceTypeIconConfig, PlaceTypeLevelGroupConfig } from "@eesimple/types";
import { remapLevelGroupMembers, remapRecordKey } from "@/services/appSettings";

// Pure transforms behind migratePlaceTypeConfig — tested without a live database.

test("remapRecordKey moves the entry onto the target when the target has none", () => {
  const display: PlaceTypeDisplayConfig = {
    city: {
      displayMode: "pin",
      visible: true,
      sortOrder: 3,
      color: "#ff0000",
    },
  };
  const next = remapRecordKey(display, "city", "town");
  assert.ok(next);
  assert.equal(next.city, undefined);
  assert.deepEqual(next.town, {
    displayMode: "pin",
    visible: true,
    sortOrder: 3,
    color: "#ff0000",
  });
});

test("remapRecordKey keeps the target's existing entry but still drops the old key", () => {
  const icons: PlaceTypeIconConfig = {
    city: "building",
    town: "home",
  };
  const next = remapRecordKey(icons, "city", "town");
  assert.ok(next);
  assert.equal(next.city, undefined);
  // Target already had a glyph — it wins; we don't overwrite it.
  assert.equal(next.town, "home");
});

test("remapRecordKey returns null when the source key is absent (nothing to migrate)", () => {
  assert.equal(remapRecordKey({
    town: "home",
  }, "city", "village"), null);
});

test("remapLevelGroupMembers replaces the member and dedupes when target already present", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "g1",
      name: "Urban",
      placeTypes: ["city", "town"],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
    {
      id: "g2",
      name: "Other",
      placeTypes: ["village"],
      displayMode: "pin",
      visible: true,
      sortOrder: 1,
    },
  ];
  const next = remapLevelGroupMembers(groups, "city", "town");
  assert.ok(next);
  // city removed; town not duplicated.
  assert.deepEqual(next[0].placeTypes, ["town"]);
  // Untouched group is returned as-is.
  assert.deepEqual(next[1].placeTypes, ["village"]);
});

test("remapLevelGroupMembers renames the member when the target is not yet a member", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "g1",
      name: "Urban",
      placeTypes: ["city"],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
  ];
  const next = remapLevelGroupMembers(groups, "city", "metropolis");
  assert.ok(next);
  assert.deepEqual(next[0].placeTypes, ["metropolis"]);
});

test("remapLevelGroupMembers returns null when no group references the source", () => {
  const groups: PlaceTypeLevelGroupConfig = [
    {
      id: "g1",
      name: "Urban",
      placeTypes: ["town"],
      displayMode: "area",
      visible: true,
      sortOrder: 0,
    },
  ];
  assert.equal(remapLevelGroupMembers(groups, "city", "village"), null);
});
