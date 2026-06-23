import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Import route schema-validation tests — they exercise the request guards without a live
// database/network (every case fails validation before the handler touches the DB).

test("POST /api/imports/ingest/paste rejects an empty body", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/ingest/paste",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/ingest/paste rejects an unknown kind", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/ingest/paste",
    payload: {
      content: "x",
      kind: "pdf",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/ingest/url rejects a malformed URL", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/ingest/url",
    payload: {
      url: "not-a-url",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/ingest/url rejects a private (SSRF) URL", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/ingest/url",
    payload: {
      url: "http://localhost/post",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/imports/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/imports/not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/imports/items/:itemId rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/imports/items/not-a-uuid",
    payload: {
      title: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/items/pending/reject isn't captured by the :itemId route", async () => {
  // The static `pending` path must out-rank `:itemId`, so this never reaches the uuid param guard.
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/items/pending/reject",
  });
  assert.notEqual(res.statusCode, 400);
  assert.notEqual(res.statusCode, 404);
  await app.close();
});

test("POST /api/imports/items/:itemId/unreject rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/items/not-a-uuid/unreject",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/items/:itemId/block rejects a missing entry body", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/items/00000000-0000-0000-0000-000000000000/block",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/imports/items/:itemId/block rejects an unknown kind", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/items/00000000-0000-0000-0000-000000000000/block",
    payload: {
      kind: "regex",
      value: "example.com",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
