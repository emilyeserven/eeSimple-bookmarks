import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ScanResult } from "@eesimple/types";
import { clearScanCache, getCachedScan, scanCacheKey, setCachedScan } from "@/services/scanCache";

/** A minimal scan result, distinguishable by `finalUrl`. */
function scan(url: string): ScanResult {
  return {
    finalUrl: url,
    redirected: false,
    website: {
      domain: null,
      exists: false,
      siteName: null,
      mediaTypeId: null,
      shortener: null,
    },
    duplicate: {
      exactMatch: null,
      pathMatch: null,
    },
    title: null,
    description: null,
    isYouTube: false,
    channel: null,
    durationSeconds: null,
    datePosted: null,
    thumbnailUrl: null,
    imageCandidates: [],
    authorNames: null,
    languageCode: null,
    socialAccount: null,
    isbn: null,
    faviconUrl: null,
  };
}

afterEach(() => {
  clearScanCache();
});

test("scanCacheKey varies by url, site-name hint, and redirect flag", () => {
  const a = scanCacheKey("https://example.com", undefined, true);
  assert.notEqual(a, scanCacheKey("https://example.org", undefined, true));
  assert.notEqual(a, scanCacheKey("https://example.com", "Example", true));
  assert.notEqual(a, scanCacheKey("https://example.com", undefined, false));
  // Identical inputs produce the same key (trims surrounding whitespace).
  assert.equal(a, scanCacheKey(" https://example.com ", undefined, true));
});

test("set then get returns the cached result before TTL", () => {
  const key = scanCacheKey("https://example.com", undefined, true);
  setCachedScan(key, scan("https://example.com"), 1000);
  assert.equal(getCachedScan(key, 1000 + 59_000)?.finalUrl, "https://example.com");
});

test("a cached scan expires after the TTL", () => {
  const key = scanCacheKey("https://example.com", undefined, true);
  setCachedScan(key, scan("https://example.com"), 1000);
  // 60s TTL: at +60_000 it's expired (expires <= now).
  assert.equal(getCachedScan(key, 1000 + 60_000), null);
});

test("the cache evicts the oldest entries past the size cap", () => {
  // Insert more than MAX_ENTRIES (500) at the same timestamp so none expire.
  for (let i = 0; i < 600; i++) {
    setCachedScan(scanCacheKey(`https://example.com/${i}`, undefined, true), scan(`u${i}`), 1000);
  }
  // The earliest insertions were evicted; the most recent survive.
  assert.equal(getCachedScan(scanCacheKey("https://example.com/0", undefined, true), 1000), null);
  assert.ok(getCachedScan(scanCacheKey("https://example.com/599", undefined, true), 1000));
});
