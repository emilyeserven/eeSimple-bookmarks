import assert from "node:assert/strict";
import { test } from "node:test";
import { findOEmbedProvider } from "@eesimple/types";
import { discoverOEmbedHref, fetchOEmbedForUrl, fetchOEmbedThumbnail, normalizeOEmbed } from "@/services/oembed";

// --- findOEmbedProvider: registry URL matching (pure, no network) ---

test("findOEmbedProvider matches known media hosts (and subdomains)", () => {
  assert.equal(findOEmbedProvider("https://vimeo.com/123456789")?.name, "Vimeo");
  assert.equal(findOEmbedProvider("https://open.spotify.com/track/abc")?.name, "Spotify");
  assert.equal(findOEmbedProvider("https://soundcloud.com/artist/track")?.name, "SoundCloud");
  assert.equal(findOEmbedProvider("https://www.tiktok.com/@user/video/123")?.name, "TikTok");
  assert.equal(findOEmbedProvider("https://twitter.com/u/status/1")?.name, "X (Twitter)");
  assert.equal(findOEmbedProvider("https://x.com/u/status/1")?.name, "X (Twitter)");
  assert.equal(findOEmbedProvider("https://www.reddit.com/r/x/comments/1/y")?.name, "Reddit");
  assert.equal(findOEmbedProvider("https://www.flickr.com/photos/u/123")?.name, "Flickr");
});

test("findOEmbedProvider returns null for unknown hosts and YouTube (handled elsewhere)", () => {
  assert.equal(findOEmbedProvider("https://example.com/article"), null);
  assert.equal(findOEmbedProvider("https://www.youtube.com/watch?v=abc"), null);
  assert.equal(findOEmbedProvider("not a url"), null);
});

test("findOEmbedProvider builds a json oEmbed endpoint with the encoded url", () => {
  const provider = findOEmbedProvider("https://vimeo.com/123");
  assert.ok(provider);
  assert.equal(
    provider.endpoint("https://vimeo.com/123"),
    "https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F123&format=json",
  );
});

// --- normalizeOEmbed: field mapping + SSRF guard (pure) ---

test("normalizeOEmbed maps fields and normalizes the date", () => {
  const result = normalizeOEmbed({
    title: "  A Clip  ",
    author_name: "Creator",
    author_url: "https://vimeo.com/creator",
    thumbnail_url: "https://i.vimeocdn.com/x.jpg",
    description: "A short clip",
    upload_date: "2024-03-02 12:00:00",
  }, "Vimeo");
  assert.equal(result.title, "A Clip");
  assert.equal(result.authorName, "Creator");
  assert.equal(result.authorUrl, "https://vimeo.com/creator");
  assert.equal(result.thumbnailUrl, "https://i.vimeocdn.com/x.jpg");
  assert.equal(result.description, "A short clip");
  assert.equal(result.datePosted, "2024-03-02");
  assert.equal(result.providerName, "Vimeo");
});

test("normalizeOEmbed drops private/loopback thumbnail and author URLs (SSRF guard)", () => {
  const result = normalizeOEmbed({
    title: "x",
    author_url: "http://192.168.0.1/me",
    thumbnail_url: "http://localhost/secret.png",
  }, null);
  assert.equal(result.authorUrl, null);
  assert.equal(result.thumbnailUrl, null);
  // provider_name absent and no registry name → null
  assert.equal(result.providerName, null);
});

// --- discoverOEmbedHref: autodiscovery from <head> (pure) ---

test("discoverOEmbedHref extracts the JSON oembed link and resolves relative hrefs", () => {
  const html
    = "<head>"
      + "<link rel=\"alternate\" type=\"text/xml+oembed\" href=\"/oembed.xml?url=x\">"
      + "<link rel=\"alternate\" type=\"application/json+oembed\" href=\"/services/oembed?url=x&amp;format=json\">"
      + "</head>";
  assert.equal(
    discoverOEmbedHref(html, "https://blog.example.com/post/1"),
    "https://blog.example.com/services/oembed?url=x&format=json",
  );
});

test("discoverOEmbedHref returns null when only an XML oembed link is present", () => {
  const html = "<head><link rel=\"alternate\" type=\"text/xml+oembed\" href=\"/o.xml\"></head>";
  assert.equal(discoverOEmbedHref(html, "https://example.com/"), null);
});

// --- fetchOEmbedForUrl: network-mocked end-to-end ---

/** Install a `global.fetch` stub returning `body` for every request. Returns a restore fn. */
function stubFetch(body: string, ok = true): () => void {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(body, {
      status: ok ? 200 : 500,
      headers: {
        "content-type": "application/json",
      },
    })) as typeof global.fetch;
  return () => {
    global.fetch = originalFetch;
  };
}

test("fetchOEmbedForUrl resolves a known provider URL to normalized metadata", async () => {
  const restore = stubFetch(JSON.stringify({
    title: "Cool Video",
    author_name: "Some Creator",
    thumbnail_url: "https://i.vimeocdn.com/video/x.jpg",
    provider_name: "Vimeo",
  }));
  try {
    const meta = await fetchOEmbedForUrl("https://vimeo.com/123456789");
    assert.ok(meta);
    assert.equal(meta.title, "Cool Video");
    assert.equal(meta.authorName, "Some Creator");
    assert.equal(meta.thumbnailUrl, "https://i.vimeocdn.com/video/x.jpg");
  }
  finally {
    restore();
  }
});

test("fetchOEmbedForUrl returns null for a non-provider URL with no autodiscovery link", async () => {
  // No provider match and no head HTML → no endpoint → no network call, returns null.
  const meta = await fetchOEmbedForUrl("https://example.com/article");
  assert.equal(meta, null);
});

test("fetchOEmbedForUrl returns null when every mapped field is empty", async () => {
  const restore = stubFetch(JSON.stringify({
    type: "rich",
    version: "1.0",
  }));
  try {
    const meta = await fetchOEmbedForUrl("https://vimeo.com/123456789");
    assert.equal(meta, null);
  }
  finally {
    restore();
  }
});

// --- fetchOEmbedThumbnail: oEmbed resolve → image download ---

test("fetchOEmbedThumbnail downloads the oEmbed thumbnail bytes", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    return url.includes("oembed")
      ? new Response(JSON.stringify({
        title: "Clip",
        thumbnail_url: "https://i.vimeocdn.com/x.jpg",
      }), {
        headers: {
          "content-type": "application/json",
        },
      })
      : new Response(new Uint8Array([1, 2, 3]));
  }) as typeof global.fetch;
  try {
    const bytes = await fetchOEmbedThumbnail("https://vimeo.com/123456789");
    assert.ok(bytes);
    assert.deepEqual([...bytes], [1, 2, 3]);
  }
  finally {
    global.fetch = originalFetch;
  }
});

test("fetchOEmbedThumbnail returns null when oEmbed has no thumbnail", async () => {
  const restore = stubFetch(JSON.stringify({
    title: "Clip",
  }));
  try {
    assert.equal(await fetchOEmbedThumbnail("https://vimeo.com/123456789"), null);
  }
  finally {
    restore();
  }
});
