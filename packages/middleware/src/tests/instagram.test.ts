import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { isInstagramPostUrl, parseInstagramEmbed, parseInstagramEmbedVideo, parseInstagramProfileImageUrl, shortcodeFromUrl } from "@/services/instagram";

const SIDECAR_EMBED_HTML = readFileSync(
  new URL("./fixtures/instagram-embed-sidecar.html", import.meta.url),
  "utf8",
);

/** Build an embed `<script>` carrying a `contextJSON` (double-escaped) for the given shortcode_media. */
function embedWithContextJSON(shortcodeMedia: unknown): string {
  const contextJSON = JSON.stringify({
    context: {
      shortcode: "AbC123",
    },
    gql_data: {
      shortcode_media: shortcodeMedia,
    },
  });
  // `JSON.stringify(contextJSON)` yields the double-escaped string literal (with surrounding quotes),
  // exactly the `"contextJSON":"…"` shape Instagram emits.
  return `<html><body><script>s.handle({"require":[["PolarisEmbedSimple","init",[],[{"isRichEmbed":true,"contextJSON":${JSON.stringify(contextJSON)}}]]]});</script></body></html>`;
}

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

test("parseInstagramEmbed returns only the carousel slides from a real embed (no More posts / profile)", () => {
  const urls = parseInstagramEmbed(SIDECAR_EMBED_HTML).map(c => c.url);
  // Exactly the 3 main-post carousel slides, in order.
  assert.deepEqual(urls, [
    "https://scontent.example.com/729923719_slide1.jpg?a=1&b=2",
    "https://scontent.example.com/729729061_slide2.jpg",
    "https://scontent.example.com/729722536_slide3.jpg",
  ]);
  // The "More posts" thumbnails and the profile image live only in <img> markup, never returned.
  assert.ok(!urls.some(u => u.includes("726525526")), "no related thumbnail #1");
  assert.ok(!urls.some(u => u.includes("724216500")), "no related thumbnail #2");
  assert.ok(!urls.some(u => u.includes("439707706")), "no profile image");
});

test("parseInstagramEmbed handles a single-image contextJSON post", () => {
  const html = embedWithContextJSON({
    __typename: "GraphImage",
    display_url: "https://scontent.example.com/single-main.jpg",
    owner: {
      profile_pic_url: "https://scontent.example.com/profile.jpg",
    },
  });
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), [
    "https://scontent.example.com/single-main.jpg",
  ]);
});

test("parseInstagramEmbed reads carousel slides from contextJSON in order", () => {
  const html = embedWithContextJSON({
    __typename: "GraphSidecar",
    display_url: "https://scontent.example.com/cover.jpg",
    edge_sidecar_to_children: {
      edges: [
        {
          node: {
            display_url: "https://scontent.example.com/one.jpg",
          },
        },
        {
          node: {
            display_url: "https://scontent.example.com/two.jpg",
          },
        },
      ],
    },
  });
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), [
    "https://scontent.example.com/one.jpg",
    "https://scontent.example.com/two.jpg",
  ]);
});

test("parseInstagramEmbed falls back to the legacy __additionalDataLoaded shape", () => {
  // Older embeds inline single-escaped JSON (no contextJSON); the secondary scan handles them.
  const html = `
    <html><body>
    <script>window.__additionalDataLoaded('extra',{"shortcode_media":{
      "edge_sidecar_to_children":{"edges":[
        {"node":{"display_url":"https://scontent.cdninstagram.com/one.jpg?a=1\\u0026b=2"}},
        {"node":{"display_url":"https://scontent.cdninstagram.com/two.jpg"}},
        {"node":{"display_url":"https://scontent.cdninstagram.com/two.jpg"}}
      ]}}});</script>
    </body></html>`;
  // Deduped to the two distinct slides.
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), [
    "https://scontent.cdninstagram.com/one.jpg?a=1&b=2",
    "https://scontent.cdninstagram.com/two.jpg",
  ]);
});

test("parseInstagramEmbed falls back to og:image when no media JSON is present", () => {
  const html = "<head><meta property=\"og:image\" content=\"https://x/single.jpg\"></head>";
  assert.deepEqual(parseInstagramEmbed(html).map(c => c.url), ["https://x/single.jpg"]);
});

test("parseInstagramEmbed returns [] for garbage", () => {
  assert.deepEqual(parseInstagramEmbed("<html>nothing here</html>"), []);
});

test("parseInstagramEmbedVideo reads the video URL + dimensions from contextJSON", () => {
  const html = embedWithContextJSON({
    __typename: "GraphVideo",
    is_video: true,
    video_url: "https://scontent.example.com/reel.mp4",
    dimensions: {
      width: 720,
      height: 1280,
    },
  });
  assert.deepEqual(parseInstagramEmbedVideo(html), {
    videoUrl: "https://scontent.example.com/reel.mp4",
    width: 720,
    height: 1280,
  });
});

test("parseInstagramEmbedVideo tolerates missing dimensions", () => {
  const html = embedWithContextJSON({
    __typename: "GraphVideo",
    is_video: true,
    video_url: "https://scontent.example.com/reel.mp4",
  });
  assert.deepEqual(parseInstagramEmbedVideo(html), {
    videoUrl: "https://scontent.example.com/reel.mp4",
    width: null,
    height: null,
  });
});

test("parseInstagramEmbedVideo returns null for a non-video post", () => {
  const html = embedWithContextJSON({
    __typename: "GraphImage",
    is_video: false,
    display_url: "https://scontent.example.com/single-main.jpg",
  });
  assert.equal(parseInstagramEmbedVideo(html), null);
});

test("parseInstagramEmbedVideo falls back to a direct video_url scan for older embed markup", () => {
  const html = "<html><body><script>window.__additionalDataLoaded('extra',"
    + "{\"shortcode_media\":{\"is_video\":true,\"video_url\":\"https://scontent.cdninstagram.com/reel.mp4?a=1\\u0026b=2\"}});</script></body></html>";
  assert.deepEqual(parseInstagramEmbedVideo(html), {
    videoUrl: "https://scontent.cdninstagram.com/reel.mp4?a=1&b=2",
    width: null,
    height: null,
  });
});

test("parseInstagramEmbedVideo returns null for garbage", () => {
  assert.equal(parseInstagramEmbedVideo("<html>nothing here</html>"), null);
});

test("parseInstagramProfileImageUrl prefers the HD profile picture", () => {
  const html = "<html><script>{\"profile_pic_url\":\"https://scontent.example.com\\/std.jpg\",\"profile_pic_url_hd\":\"https://scontent.example.com\\/hd.jpg\"}</script></html>";
  assert.equal(parseInstagramProfileImageUrl(html), "https://scontent.example.com/hd.jpg");
});

test("parseInstagramProfileImageUrl falls back to the standard profile picture", () => {
  const html = "<html><script>{\"profile_pic_url\":\"https://scontent.example.com\\/std.jpg\"}</script></html>";
  assert.equal(parseInstagramProfileImageUrl(html), "https://scontent.example.com/std.jpg");
});

test("parseInstagramProfileImageUrl falls back to og:image", () => {
  const html = "<head><meta property=\"og:image\" content=\"https://x/profile-og.jpg\"></head>";
  assert.equal(parseInstagramProfileImageUrl(html), "https://x/profile-og.jpg");
});

test("parseInstagramProfileImageUrl returns null for a post embed without a profile pic or og:image", () => {
  const html = embedWithContextJSON({
    __typename: "GraphImage",
    display_url: "https://scontent.example.com/main.jpg",
  });
  assert.equal(parseInstagramProfileImageUrl(html), null);
});

test("parseInstagramProfileImageUrl returns null for garbage", () => {
  assert.equal(parseInstagramProfileImageUrl("<html>nothing here</html>"), null);
});
