import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/saved-filters rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/saved-filters",
    payload: {
      filters: {},
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/saved-filters rejects a payload missing the filters", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/saved-filters",
    payload: {
      name: "Mine",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/saved-filters rejects a non-object filters value", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/saved-filters",
    payload: {
      name: "Mine",
      filters: "not-an-object",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/saved-filters rejects a non-boolean viewableOnline", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/saved-filters",
    payload: {
      name: "Mine",
      filters: {},
      viewableOnline: "yes",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/saved-filters/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/saved-filters/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
