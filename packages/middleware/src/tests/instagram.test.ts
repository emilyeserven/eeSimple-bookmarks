import assert from "node:assert/strict";
import { test } from "node:test";

import { isInstagramPostUrl, parseInstagramEmbed, shortcodeFromUrl } from "@/services/instagram";

test("shortcodeFromUrl extracts post / reel / tv shortcodes", () => {
  assert.equal(shortcodeFromUrl("https://www.instagram.com/p/DaMJ56olZff/?img_index=2"), "DaMJ56olZff");
  assert.equal(shortcodeFromUrl("https://instagram.com/reel/AbC-123_x/"), "AbC-123_x");
  assert.equal(shortcodeFromUrl("https://www.instagram.com/tv/XyZ987/"), "XyZ987");
});

test("shortcodeFromUrl rejects non-post Instagram and other hosts", () => {
  assert.equal(shortcodeFromUrl("https://www.instagram.com/someuser/"), null);
  assert.equal(shortcodeFromUrl("https://example.com/p/DaMJ56olZff/"), null);
  assert.equal(shortcodeFromUrl("not a url"), null);
});

test("isInstagramPostUrl mirrors shortcode detection", () => {
  assert.equal(isInstagramPostUrl("https://www.instagram.com/p/DaMJ56olZff/?img_index=2"), true);
  assert.equal(isInstagramPostUrl("https://www.instagram.com/someuser/"), false);
});

test("parseInstagramEmbed returns every carousel image at full size", () => {
  // JSON-escaped display_url values, as they appear in the embed page's data blob.
  const html = `
    <html><body>
    <script>window.__additionalDataLoaded('extra',{"shortcode_media":{
      "edge_sidecar_to_children":{"edges":[
        {"node":{"display_url":"https://scontent.cdninstagram.com/one.jpg?a=1\\u0026b=2"}},
        {"node":{"display_url":"https://scontent.cdninstagram.com/two.jpg"}},
        {"node":{"display_url":"https://scontent.cdninstagram.com/three.jpg"}}
      ]}}});</script>
    </body></html>`;
  const result = parseInstagramEmbed(html);
  assert.deepEqual(result.map(c => c.url), [
    "https://scontent.cdninstagram.com/one.jpg?a=1&b=2",
    "https://scontent.cdninstagram.com/two.jpg",
    "https://scontent.cdninstagram.com/three.jpg",
  ]);
  assert.ok(result.every(c => c.source === "instagram"));
});

test("parseInstagramEmbed dedupes repeated display_url values", () => {
  const html = "\"display_url\":\"https://x/a.jpg\" ... \"display_url\":\"https://x/a.jpg\"";
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), ["https://x/a.jpg"]);
});

test("parseInstagramEmbed falls back to og:image for a single-image post", () => {
  const html = "<head><meta property=\"og:image\" content=\"https://x/single.jpg\"></head>";
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), ["https://x/single.jpg"]);
});

test("parseInstagramEmbed returns [] for garbage", () => {
  assert.deepEqual(parseInstagramEmbed("<html>nothing here</html>"), []);
});
