import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { isValidUrl } from "@/utils/url";

// These tests use Fastify's `inject` and pure helpers, so they run without a live database.

test("GET /healthz returns ok", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/healthz",
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), {
    status: "ok",
  });
  await app.close();
});

test("POST /api/bookmarks rejects a payload missing required fields", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      title: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks rejects an invalid url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "not-a-url",
      title: "Broken",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("isValidUrl accepts http(s) URLs and rejects everything else", () => {
  assert.equal(isValidUrl("https://example.com"), true);
  assert.equal(isValidUrl("http://example.com/path?q=1"), true);
  assert.equal(isValidUrl("not-a-url"), false);
  assert.equal(isValidUrl("ftp://example.com"), false);
});
