import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { decodeEntities, extractTitle } from "@/services/metadata";

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
