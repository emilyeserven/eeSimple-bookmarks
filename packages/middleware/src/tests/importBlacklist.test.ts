import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blacklistPatternsFor,
  isBlacklisted,
  type ImportBlacklistEntry,
  normalizeBlacklist,
} from "@eesimple/types";

// Pure blacklist matching — no network or database.

test("isBlacklisted matches a whole domain, including subdomains and ignoring www/scheme/query", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "domain",
    value: "example.com",
  }];
  assert.equal(isBlacklisted("https://example.com/anything", entries), true);
  assert.equal(isBlacklisted("http://www.example.com/x?y=1", entries), true);
  assert.equal(isBlacklisted("https://news.example.com/post", entries), true);
  assert.equal(isBlacklisted("https://notexample.com/post", entries), false);
  assert.equal(isBlacklisted("https://example.org/post", entries), false);
});

test("isBlacklisted path-prefix matches the prefix and its sub-paths only, same host", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "path-prefix",
    value: "example.com/sponsored",
  }];
  assert.equal(isBlacklisted("https://example.com/sponsored", entries), true);
  assert.equal(isBlacklisted("https://example.com/sponsored/deal-123?ref=a", entries), true);
  assert.equal(isBlacklisted("https://www.example.com/sponsored/x", entries), true);
  assert.equal(isBlacklisted("https://example.com/sponsoredish", entries), false);
  assert.equal(isBlacklisted("https://example.com/articles", entries), false);
  assert.equal(isBlacklisted("https://other.com/sponsored", entries), false);
});

test("isBlacklisted exact matches host+path, ignoring query/fragment and trailing slash", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "exact",
    value: "example.com/post",
  }];
  assert.equal(isBlacklisted("https://example.com/post", entries), true);
  assert.equal(isBlacklisted("https://example.com/post/", entries), true);
  assert.equal(isBlacklisted("https://example.com/post?utm=1", entries), true);
  assert.equal(isBlacklisted("https://example.com/post/sub", entries), false);
});

test("isBlacklisted returns false for a malformed URL or an empty list", () => {
  assert.equal(isBlacklisted("not a url", [{
    kind: "domain",
    value: "example.com",
  }]), false);
  assert.equal(isBlacklisted("https://example.com/x", []), false);
});

test("blacklistPatternsFor derives the three candidate entries from a resolved URL", () => {
  const patterns = blacklistPatternsFor("https://www.Example.com/Sponsored/Deal/?ref=a#x");
  assert.deepEqual(patterns.domain, {
    kind: "domain",
    value: "example.com",
  });
  assert.deepEqual(patterns.pathPrefix, {
    kind: "path-prefix",
    value: "example.com/sponsored/deal",
  });
  assert.deepEqual(patterns.exact, {
    kind: "exact",
    value: "example.com/sponsored/deal",
  });
});

test("normalizeBlacklist trims, lower-cases, host-strips, and de-duplicates", () => {
  const result = normalizeBlacklist([
    {
      kind: "domain",
      value: "  www.Example.COM ",
    },
    {
      kind: "domain",
      value: "example.com",
    },
    {
      kind: "path-prefix",
      value: "Example.com/Sponsored/",
    },
    {
      kind: "exact",
      value: "   ",
    },
  ]);
  assert.deepEqual(result, [
    {
      kind: "domain",
      value: "example.com",
    },
    {
      kind: "path-prefix",
      value: "example.com/sponsored",
    },
  ]);
});
