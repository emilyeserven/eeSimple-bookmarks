import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/favorite-settings-pages rejects a payload missing the path", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/favorite-settings-pages",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("DELETE /api/favorite-settings-pages/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "DELETE",
    url: "/api/favorite-settings-pages/not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
