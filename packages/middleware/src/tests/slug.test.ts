import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify, uniqueSlug } from "@/utils/slug";

test("slugify lowercases and hyphenates non-alphanumeric runs", () => {
  assert.equal(slugify("Recipes"), "recipes");
  assert.equal(slugify("My Cool Bookmarks!"), "my-cool-bookmarks");
  assert.equal(slugify("  Spaced   Out  "), "spaced-out");
  assert.equal(slugify("Dev / Tools"), "dev-tools");
});

test("slugify returns empty when there is nothing usable", () => {
  assert.equal(slugify("!!!"), "");
});

test("uniqueSlug appends a numeric suffix on collision", () => {
  assert.equal(uniqueSlug("Recipes", []), "recipes");
  assert.equal(uniqueSlug("Recipes", ["recipes"]), "recipes-2");
  assert.equal(uniqueSlug("Recipes", ["recipes", "recipes-2"]), "recipes-3");
});

test("uniqueSlug falls back to a default base for empty slugs", () => {
  assert.equal(uniqueSlug("!!!", []), "item");
  assert.equal(uniqueSlug("!!!", ["item"]), "item-2");
  assert.equal(uniqueSlug("!!!", [], "tag"), "tag");
});
