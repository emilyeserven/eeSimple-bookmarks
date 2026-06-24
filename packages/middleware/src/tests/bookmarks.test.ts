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
    payload: {},
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

test("POST /api/bookmarks rejects a booleanValue with a non-uuid propertyId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      booleanValues: [{
        propertyId: "not-a-uuid",
        value: true,
      }],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks rejects a non-uuid categoryId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      categoryId: "not-a-uuid",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks accepts a well-formed textValues payload (ISBN/text values are no longer rejected by the schema)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      textValues: [{
        propertyId: "11111111-1111-1111-1111-111111111111",
        value: "9780134685991",
      }],
    },
  });
  // Before the schema fix this 400'd (`additionalProperties: false` rejected `textValues`). It now
  // passes schema validation and reaches the handler (which may then fail on the DB in this harness).
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks rejects a textValue with a non-uuid propertyId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      textValues: [{
        propertyId: "not-a-uuid",
        value: "x",
      }],
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
