import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchHostedMetadata, hostedMetadataEnabled } from "@/services/hostedMetadata";

const ENV_KEYS = ["HOSTED_METADATA_ENDPOINT", "HOSTED_METADATA_API_KEY", "HOSTED_METADATA_PROVIDER"];

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

/** Stub `global.fetch` to return `body` for every request. Returns a restore fn. */
function stubFetch(body: string, ok = true, contentType = "text/html"): () => void {
  const original = global.fetch;
  global.fetch = (async () =>
    new Response(body, {
      status: ok ? 200 : 500,
      headers: {
        "content-type": contentType,
      },
    })) as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

test("hostedMetadataEnabled reflects the endpoint env var", () => {
  assert.equal(hostedMetadataEnabled(), false);
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  assert.equal(hostedMetadataEnabled(), true);
});

test("fetchHostedMetadata returns null when disabled (no endpoint set)", async () => {
  assert.equal(await fetchHostedMetadata("https://example.com"), null);
});

test("fetchHostedMetadata parses metadata from Browserless-rendered HTML", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  const html = `<!DOCTYPE html><html><head>
    <meta property="og:title" content="A JS-Rendered Page" />
    <meta property="og:description" content="Loaded by the hosted provider." />
    <meta property="og:image" content="https://cdn.example.com/card.png" />
    <meta property="og:article:person" content="Jane Doe" />
    <meta property="og:site_name" content="Example Co" />
    <meta property="article:published_time" content="2024-09-01T10:00:00.000Z" />
  </head><body></body></html>`;
  const restore = stubFetch(html);
  try {
    const meta = await fetchHostedMetadata("https://example.com/app");
    assert.ok(meta);
    assert.equal(meta.title, "A JS-Rendered Page");
    assert.equal(meta.imageUrl, "https://cdn.example.com/card.png");
    assert.equal(meta.authorName, "Jane Doe");
    assert.equal(meta.publisher, "Example Co");
    assert.equal(meta.datePosted, "2024-09-01");
  }
  finally {
    restore();
  }
});

test("fetchHostedMetadata returns null when every field is empty", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  const restore = stubFetch("<!DOCTYPE html><html><head></head><body></body></html>");
  try {
    assert.equal(await fetchHostedMetadata("https://example.com"), null);
  }
  finally {
    restore();
  }
});

test("fetchHostedMetadata returns null on HTTP error", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "http://browserless:3000";
  const restore = stubFetch("", false);
  try {
    assert.equal(await fetchHostedMetadata("https://example.com"), null);
  }
  finally {
    restore();
  }
});
