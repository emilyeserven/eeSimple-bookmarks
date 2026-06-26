import assert from "node:assert/strict";
import { test } from "node:test";

import { builtInWebsiteRenamedOrMoved, buildWebsiteScalarPatch, normalizeWebsiteDomain } from "@/services/websiteUpdate";

test("normalizeWebsiteDomain: strips a leading www. and lowercases", () => {
  assert.equal(normalizeWebsiteDomain("WWW.Example.COM"), "example.com");
  assert.equal(normalizeWebsiteDomain("example.com"), "example.com");
  assert.equal(normalizeWebsiteDomain("www.sub.example.com"), "sub.example.com");
});

test("builtInWebsiteRenamedOrMoved: false when name/domain unchanged", () => {
  const existing = {
    siteName: "Example",
    domain: "example.com",
  };
  assert.equal(builtInWebsiteRenamedOrMoved({}, existing), false);
  assert.equal(builtInWebsiteRenamedOrMoved({
    siteName: "Example",
  }, existing), false);
  // www. + casing differences are not a "move".
  assert.equal(builtInWebsiteRenamedOrMoved({
    domain: "WWW.example.com",
  }, existing), false);
});

test("builtInWebsiteRenamedOrMoved: true on a real rename or move", () => {
  const existing = {
    siteName: "Example",
    domain: "example.com",
  };
  assert.equal(builtInWebsiteRenamedOrMoved({
    siteName: "Renamed",
  }, existing), true);
  assert.equal(builtInWebsiteRenamedOrMoved({
    domain: "other.com",
  }, existing), true);
});

test("buildWebsiteScalarPatch: only sets provided fields", () => {
  assert.deepEqual(buildWebsiteScalarPatch({}), {});
  assert.deepEqual(buildWebsiteScalarPatch({
    siteName: "New",
  }), {
    siteName: "New",
  });
});

test("buildWebsiteScalarPatch: explicit null clears nullable associations", () => {
  // `in input` (null) clears; omitted leaves unchanged.
  assert.deepEqual(buildWebsiteScalarPatch({
    categoryId: null,
  }), {
    categoryId: null,
  });
  assert.deepEqual(buildWebsiteScalarPatch({
    mediaTypeId: "mt1",
  }), {
    mediaTypeId: "mt1",
  });
  assert.deepEqual(buildWebsiteScalarPatch({
    socialLinks: undefined,
  }), {
    socialLinks: [],
  });
  assert.deepEqual(buildWebsiteScalarPatch({
    redirectResolutionFailure: undefined,
  }), {
    redirectResolutionFailure: false,
  });
});

test("buildWebsiteScalarPatch: never sets domain or slug (those need a DB lookup)", () => {
  const patch = buildWebsiteScalarPatch({
    siteName: "X",
    domain: "moved.com",
  });
  assert.equal("domain" in patch, false);
  assert.equal("slug" in patch, false);
  assert.equal(patch.siteName, "X");
});
