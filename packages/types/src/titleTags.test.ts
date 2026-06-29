import assert from "node:assert/strict";
import { test } from "node:test";

import type { TitleTagCandidate } from "./titleTags.js";

import { matchTagIdsByTitle, titleMatchesTerm } from "./titleTags.js";

// --- titleMatchesTerm ---

test("titleMatchesTerm matches Latin whole words case-insensitively", () => {
  assert.equal(titleMatchesTerm("Learning React Hooks", "react"), true);
  assert.equal(titleMatchesTerm("REACT in depth", "React"), true);
  assert.equal(titleMatchesTerm("A guide to react.", "react"), true);
});

test("titleMatchesTerm does not match a Latin term inside a larger word", () => {
  assert.equal(titleMatchesTerm("Martin's blog", "art"), false);
  assert.equal(titleMatchesTerm("Reactor design", "react"), false);
});

test("titleMatchesTerm matches non-spaced scripts as a substring", () => {
  // Korean compound: "부산" sits inside "부산광역시" with no word boundary.
  assert.equal(titleMatchesTerm("부산광역시", "부산"), true);
  // Japanese: "九州" inside a longer run.
  assert.equal(titleMatchesTerm("九州旅行ガイド", "九州"), true);
});

test("titleMatchesTerm handles punctuated and multi-word Latin names", () => {
  assert.equal(titleMatchesTerm("Best sci-fi of 2026", "sci-fi"), true);
  assert.equal(titleMatchesTerm("Notes on C++ templates", "C++"), true);
  assert.equal(titleMatchesTerm("Machine learning basics", "machine learning"), true);
});

test("titleMatchesTerm ignores empty/whitespace terms", () => {
  assert.equal(titleMatchesTerm("Anything", ""), false);
  assert.equal(titleMatchesTerm("Anything", "   "), false);
});

// --- matchTagIdsByTitle ---

const busan: TitleTagCandidate = {
  id: "t-busan",
  name: "부산",
  romanizedName: "Busan",
};
const kyushu: TitleTagCandidate = {
  id: "t-kyushu",
  name: "九州",
  romanizedName: "Kyushu",
};
const react: TitleTagCandidate = {
  id: "t-react",
  name: "React",
  romanizedName: null,
};

test("matchTagIdsByTitle matches a native name inside a non-spaced compound title", () => {
  assert.deepEqual(matchTagIdsByTitle("부산광역시", null, [busan, kyushu, react]), ["t-busan"]);
});

test("matchTagIdsByTitle matches a romanized name against a Latin title", () => {
  assert.deepEqual(
    matchTagIdsByTitle("Taking the Ferry from Busan to Fukuoka", null, [busan, kyushu, react]),
    ["t-busan"],
  );
});

test("matchTagIdsByTitle matches against the romanizedTitle haystack", () => {
  // Title in one script, the bookmark's romanized title carries the other form.
  assert.deepEqual(
    matchTagIdsByTitle("旅行記", "Kyushu travel notes", [busan, kyushu, react]),
    ["t-kyushu"],
  );
});

test("matchTagIdsByTitle returns every matching tag and ignores empty input", () => {
  assert.deepEqual(matchTagIdsByTitle("Styling React with CSS", null, [react]), ["t-react"]);
  assert.deepEqual(matchTagIdsByTitle("Martin's portfolio", null, [react]), []);
  assert.deepEqual(matchTagIdsByTitle("", null, [busan]), []);
  assert.deepEqual(matchTagIdsByTitle("", "   ", [busan]), []);
});
