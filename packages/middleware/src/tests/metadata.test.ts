import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { decodeEntities, extractTitle, fetchPageTitle } from "@/services/metadata";

// These tests cover schema validation and the pure title-parsing helpers, so
// they run without a live network or database.

test("GET /api/fetch-title rejects a request with no url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/fetch-title",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/fetch-title rejects an invalid url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/fetch-title?url=not-a-url",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("extractTitle pulls and normalises the <title> contents", () => {
  assert.equal(
    extractTitle("<html><head><title>  Hello   World </title></head></html>"),
    "Hello World",
  );
  assert.equal(
    extractTitle("<title lang=\"en\">Example Domain</title>"),
    "Example Domain",
  );
  assert.equal(extractTitle("<html><head></head><body>no title</body></html>"), null);
  assert.equal(extractTitle("<title>   </title>"), null);
});

test("decodeEntities decodes the common named and numeric entities", () => {
  assert.equal(decodeEntities("Tom &amp; Jerry"), "Tom & Jerry");
  assert.equal(decodeEntities("&lt;tag&gt;"), "<tag>");
  assert.equal(decodeEntities("It&#39;s &quot;quoted&quot;"), "It's \"quoted\"");
  assert.equal(decodeEntities("&#65;&#x42;"), "AB");
});

// fetchPageTitle — unit tests using a mocked global fetch

test("fetchPageTitle returns { kind: 'ok' } when the page has a title", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html><head><title>My Page</title></head></html>", {
    status: 200,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "ok");
    assert.equal(result.kind === "ok" ? result.title : "", "My Page");
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'no_title' } when body has no <title>", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("<html><body>no title here</body></html>", {
    status: 200,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "no_title");
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'http_error' } with the status on a non-ok response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, {
    status: 403,
  });
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "http_error");
    assert.equal(result.kind === "http_error" ? result.status : 0, 403);
  }
  finally { globalThis.fetch = original; }
});

test("fetchPageTitle returns { kind: 'timeout' } on an AbortError", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new DOMException("The operation was aborted", "AbortError");
  };
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "timeout");
  }
  finally {
    globalThis.fetch = original;
  }
});

test("fetchPageTitle returns { kind: 'network_error' } on a non-abort exception", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Connection refused");
  };
  try {
    const result = await fetchPageTitle("https://example.com");
    assert.equal(result.kind, "network_error");
  }
  finally {
    globalThis.fetch = original;
  }
});
