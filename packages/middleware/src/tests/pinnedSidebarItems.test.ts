import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/pinned-sidebar-items rejects a payload missing the entityType", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/pinned-sidebar-items",
    payload: {
      entityId: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/pinned-sidebar-items rejects a payload missing the entityId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/pinned-sidebar-items",
    payload: {
      entityType: "category",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/pinned-sidebar-items rejects an unknown entityType", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/pinned-sidebar-items",
    payload: {
      entityType: "bookmark",
      entityId: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("DELETE /api/pinned-sidebar-items/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "DELETE",
    url: "/api/pinned-sidebar-items/not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
