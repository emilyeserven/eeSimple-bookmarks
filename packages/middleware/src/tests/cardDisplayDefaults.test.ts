import assert from "node:assert/strict";
import { test } from "node:test";

import {
  defaultBodyZone,
  defaultFieldZones,
  HEADER_CARD_FIELD_KEYS,
  STANDARD_CARD_FIELD_KEYS,
} from "@/services/cardDisplayDefaults";

test("defaultBodyZone routes description, secondaryName, and header fields to card-single-top", () => {
  assert.equal(defaultBodyZone("description"), "card-single-top");
  assert.equal(defaultBodyZone("secondaryName"), "card-single-top");
  for (const key of HEADER_CARD_FIELD_KEYS) {
    assert.equal(defaultBodyZone(key), "card-single-top");
  }
});

test("defaultBodyZone routes every other field to card-labels", () => {
  assert.equal(defaultBodyZone("category"), "card-labels");
  assert.equal(defaultBodyZone("website"), "card-labels");
  assert.equal(defaultBodyZone("tags"), "card-labels");
  // An unknown / custom-property key falls through to the pill zone.
  assert.equal(defaultBodyZone("prop:abc123"), "card-labels");
});

test("defaultFieldZones places every standard field exactly once across the body zones", () => {
  const zones = defaultFieldZones();
  const placed = [...zones["card-single-top"], ...zones["card-labels"]].map(p => p.key);
  assert.deepEqual([...placed].sort(), [...STANDARD_CARD_FIELD_KEYS].sort());
});

test("defaultFieldZones puts each standard field in its defaultBodyZone and leaves image corners empty", () => {
  const zones = defaultFieldZones();
  const topKeys = zones["card-single-top"].map(p => p.key);
  assert.ok(topKeys.includes("description"));
  assert.ok(topKeys.includes("title"));
  assert.ok(zones["card-labels"].map(p => p.key).includes("category"));
  for (const corner of ["image-top-left", "image-top-right", "image-bottom-left", "image-bottom-right"] as const) {
    assert.equal(zones[corner].length, 0);
  }
});
