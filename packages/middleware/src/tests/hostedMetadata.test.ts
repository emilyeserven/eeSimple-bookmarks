import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { fetchHostedMetadata, hostedMetadataEnabled } from "@/services/hostedMetadata";

const ENV_KEYS = ["HOSTED_METADATA_ENDPOINT", "HOSTED_METADATA_API_KEY", "HOSTED_METADATA_PROVIDER"];

afterEach(() => {
  for (const k of ENV_KEYS) delete process.env[k];
});

/** Stub `global.fetch` to return `body` for every request. Returns a restore fn. */
function stubFetch(body: string, ok = true): () => void {
  const original = global.fetch;
  global.fetch = (async () =>
    new Response(body, {
      status: ok ? 200 : 500,
      headers: {
        "content-type": "application/json",
      },
    })) as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

test("hostedMetadataEnabled reflects the endpoint env var", () => {
  assert.equal(hostedMetadataEnabled(), false);
  process.env.HOSTED_METADATA_ENDPOINT = "https://api.microlink.io/";
  assert.equal(hostedMetadataEnabled(), true);
});

test("fetchHostedMetadata returns null when disabled (no endpoint set)", async () => {
  assert.equal(await fetchHostedMetadata("https://example.com"), null);
});

test("fetchHostedMetadata maps a Microlink-style response", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "https://api.microlink.io/";
  const restore = stubFetch(JSON.stringify({
    status: "success",
    data: {
      title: "A JS-Rendered Page",
      description: "Loaded by the hosted provider.",
      image: {
        url: "https://cdn.example.com/card.png",
      },
      author: "Jane Doe",
      publisher: "Example Co",
      date: "2024-09-01T10:00:00.000Z",
    },
  }));
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
  process.env.HOSTED_METADATA_ENDPOINT = "https://api.microlink.io/";
  const restore = stubFetch(JSON.stringify({
    data: {},
  }));
  try {
    assert.equal(await fetchHostedMetadata("https://example.com"), null);
  }
  finally {
    restore();
  }
});
