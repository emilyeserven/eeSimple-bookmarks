import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Route schema-validation tests — they exercise the request guards without a live database/network.

test("POST /api/newsletters/ingest/paste rejects an empty body", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/newsletters/ingest/paste",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/newsletters/ingest/paste rejects an unknown kind", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/newsletters/ingest/paste",
    payload: {
      content: "x",
      kind: "pdf",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/newsletters/ingest/url rejects a malformed URL", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/newsletters/ingest/url",
    payload: {
      url: "not-a-url",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/newsletters/ingest/url rejects a private (SSRF) URL", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/newsletters/ingest/url",
    payload: {
      url: "http://localhost/post",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/newsletters/imports/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/newsletters/imports/not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
