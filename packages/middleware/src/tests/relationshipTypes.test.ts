import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/relationship-types rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/relationship-types",
    payload: {
      directional: true,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/relationship-types rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/relationship-types",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/relationship-types rejects a non-boolean directional", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/relationship-types",
    payload: {
      name: "Related",
      directional: "yes",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/relationship-types/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/relationship-types/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/relationship-types/:id rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/relationship-types/11111111-1111-1111-1111-111111111111",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
