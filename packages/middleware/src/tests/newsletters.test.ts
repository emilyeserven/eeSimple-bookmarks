import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Newsletter publication-taxonomy route schema-validation tests — they exercise the request guards
// without a live database/network.

test("POST /api/newsletters rejects an empty body", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/newsletters",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/newsletters/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/newsletters/not-a-uuid",
    payload: {
      name: "Renamed",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/newsletters/:id/issues rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/newsletters/not-a-uuid/issues",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
