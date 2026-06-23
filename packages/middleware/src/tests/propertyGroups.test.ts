import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/property-groups rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/property-groups",
    payload: {
      description: "no name",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/property-groups rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/property-groups",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/property-groups rejects a non-integer priority", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/property-groups",
    payload: {
      name: "Group",
      priority: "high",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/property-groups/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/property-groups/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/property-groups/:id rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/property-groups/11111111-1111-1111-1111-111111111111",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
