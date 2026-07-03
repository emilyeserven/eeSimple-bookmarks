import assert from "node:assert/strict";
import { test } from "node:test";

import { deriveRomanizedName, orderRomanized, romanizedSortKey } from "./romanized.js";

// --- orderRomanized ---

test("orderRomanized returns name as primary with no secondary when there is no romanized value", () => {
  assert.deepEqual(orderRomanized("東京", null, false), {
    primary: "東京",
    secondary: null,
  });
  assert.deepEqual(orderRomanized("東京", "   ", true), {
    primary: "東京",
    secondary: null,
  });
});

test("orderRomanized swaps primary/secondary based on showRomanizedFirst", () => {
  assert.deepEqual(orderRomanized("東京", "Tokyo", false), {
    primary: "東京",
    secondary: "Tokyo",
  });
  assert.deepEqual(orderRomanized("東京", "Tokyo", true), {
    primary: "Tokyo",
    secondary: "東京",
  });
});

// --- romanizedSortKey ---

test("romanizedSortKey uses the romanized form only when sorting by romanized and one exists", () => {
  assert.equal(romanizedSortKey("東京", "Tokyo", true), "Tokyo");
  assert.equal(romanizedSortKey("東京", "Tokyo", false), "東京");
  assert.equal(romanizedSortKey("東京", null, true), "東京");
});

// --- deriveRomanizedName ---

test("deriveRomanizedName returns a trimmed candidate that differs from the name", () => {
  assert.equal(deriveRomanizedName("東京", "Tokyo"), "Tokyo");
  assert.equal(deriveRomanizedName("東京", "  Tokyo  "), "Tokyo");
});

test("deriveRomanizedName returns null when the candidate is empty or equal to the name", () => {
  assert.equal(deriveRomanizedName("Tokyo", "Tokyo"), null);
  assert.equal(deriveRomanizedName("Paris", null), null);
  assert.equal(deriveRomanizedName("Paris", "   "), null);
});
