import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed), matching the
// `customProperties` test style.

test("POST /api/categories rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/categories",
    payload: {
      description: "no name",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/categories rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/categories",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/categories/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/categories/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/categories/:id/root-tags rejects a non-uuid tag id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/categories/11111111-1111-1111-1111-111111111111/root-tags",
    payload: {
      tagIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/homepage-tags rejects a non-uuid tag id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/homepage-tags",
    payload: {
      tagIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-properties rejects a non-uuid categoryId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-properties",
    payload: {
      name: "Priority",
      type: "number",
      categoryIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
