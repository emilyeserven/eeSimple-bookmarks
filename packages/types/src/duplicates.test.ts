import assert from "node:assert/strict";
import { test } from "node:test";

import type { WebsiteParamRule } from "./index.js";

import { bookmarkPageKey, mostSpecificParamRule, normalizeTitleKey } from "./duplicates.js";

test("normalizeTitleKey lower-cases, collapses whitespace, and trims", () => {
  assert.equal(normalizeTitleKey("  The  Lord\tof the\n Rings  "), "the lord of the rings");
});

test("normalizeTitleKey returns null for titles under 4 normalized chars", () => {
  assert.equal(normalizeTitleKey("abc"), null);
  assert.equal(normalizeTitleKey("  a  b "), null);
  assert.equal(normalizeTitleKey(""), null);
  assert.equal(normalizeTitleKey("abcd"), "abcd");
});

const rules: WebsiteParamRule[] = [
  {
    pathSuffix: "",
    params: ["q"],
  },
  {
    pathSuffix: "/watch",
    params: ["v"],
  },
  {
    pathSuffix: "/playlist/watch",
    params: ["v", "list"],
  },
];

test("mostSpecificParamRule picks the longest matching pathSuffix", () => {
  assert.equal(mostSpecificParamRule(rules, "/playlist/watch"), rules[2]);
  assert.equal(mostSpecificParamRule(rules, "/watch"), rules[1]);
});

test("mostSpecificParamRule falls back to the empty-suffix rule for unmatched paths", () => {
  assert.equal(mostSpecificParamRule(rules, "/about"), rules[0]);
});

test("mostSpecificParamRule returns null when no rule matches", () => {
  assert.equal(mostSpecificParamRule([rules[1]!], "/about"), null);
  assert.equal(mostSpecificParamRule([], "/watch"), null);
});

test("mostSpecificParamRule honors contains matchMode", () => {
  const contains: WebsiteParamRule[] = [{
    pathSuffix: "/video/",
    matchMode: "contains",
    params: ["id"],
  }];
  assert.equal(mostSpecificParamRule(contains, "/video/123/comments"), contains[0]);
  assert.equal(mostSpecificParamRule(contains, "/photos/123"), null);
});

test("bookmarkPageKey is origin+pathname without a rule, ignoring query and hash", () => {
  assert.equal(
    bookmarkPageKey("https://example.com/a/b?utm_source=x#top", null),
    "https://example.com/a/b",
  );
});

test("bookmarkPageKey includes the rule's identity params, missing ones coalesced to empty", () => {
  const rule: WebsiteParamRule = {
    pathSuffix: "/watch",
    params: ["v", "list"],
  };
  assert.equal(
    bookmarkPageKey("https://youtube.com/watch?v=abc&t=42", rule),
    "https://youtube.com/watch?v=abc&list=",
  );
  assert.equal(
    bookmarkPageKey("https://youtube.com/watch?list=pl1&v=abc", rule),
    "https://youtube.com/watch?v=abc&list=pl1",
  );
});

test("bookmarkPageKey returns null for an unparseable URL", () => {
  assert.equal(bookmarkPageKey("not a url", null), null);
});
