import assert from "node:assert/strict";
import { test } from "node:test";

import type { ImportBlacklistEntry } from "./importBlacklist.js";

import { blacklistPatternsFor, isBlacklisted, normalizeBlacklist } from "./importBlacklist.js";

test("isBlacklisted: domain matches the host and its subdomains", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "domain",
    value: "spam.com",
  }];
  assert.equal(isBlacklisted("https://spam.com/x", entries), true);
  assert.equal(isBlacklisted("https://www.spam.com/x", entries), true);
  assert.equal(isBlacklisted("https://promo.spam.com/x", entries), true);
  assert.equal(isBlacklisted("https://notspam.com/x", entries), false);
});

test("isBlacklisted: exact matches host+path only, case-insensitively", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "exact",
    value: "site.com/Page/",
  }];
  assert.equal(isBlacklisted("https://site.com/page", entries), true);
  assert.equal(isBlacklisted("https://site.com/page/sub", entries), false);
});

test("isBlacklisted: path-prefix matches the prefix and sub-paths", () => {
  const entries: ImportBlacklistEntry[] = [{
    kind: "path-prefix",
    value: "site.com/blog",
  }];
  assert.equal(isBlacklisted("https://site.com/blog", entries), true);
  assert.equal(isBlacklisted("https://site.com/blog/post-1", entries), true);
  assert.equal(isBlacklisted("https://site.com/blogger", entries), false);
});

test("isBlacklisted: blank entries and unparseable URLs never match", () => {
  assert.equal(isBlacklisted("https://site.com", [{
    kind: "domain",
    value: "   ",
  }]), false);
  assert.equal(isBlacklisted("not a url", [{
    kind: "domain",
    value: "site.com",
  }]), false);
});

test("blacklistPatternsFor derives exact/domain/path-prefix entries", () => {
  const patterns = blacklistPatternsFor("https://www.Site.com/Blog/Post/");
  assert.deepEqual(patterns.exact, {
    kind: "exact",
    value: "site.com/blog/post",
  });
  assert.deepEqual(patterns.domain, {
    kind: "domain",
    value: "site.com",
  });
  assert.deepEqual(patterns.pathPrefix, {
    kind: "path-prefix",
    value: "site.com/blog/post",
  });
});

test("normalizeBlacklist trims, lower-cases, host-strips, dedupes, and drops empties", () => {
  const out = normalizeBlacklist([
    {
      kind: "domain",
      value: " WWW.Site.com ",
    },
    {
      kind: "domain",
      value: "site.com",
    }, // dup after normalization
    {
      kind: "exact",
      value: "Site.com/Path/",
    },
    {
      kind: "path-prefix",
      value: "   ",
    }, // empty after trim
    {
      kind: "bogus" as ImportBlacklistEntry["kind"],
      value: "x",
    }, // invalid kind
  ]);
  assert.deepEqual(out, [
    {
      kind: "domain",
      value: "site.com",
    },
    {
      kind: "exact",
      value: "site.com/path",
    },
  ]);
});
