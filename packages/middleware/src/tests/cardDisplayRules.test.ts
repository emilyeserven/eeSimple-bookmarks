import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed), matching the
// `customProperties` test style.

test("POST /api/card-display-rules rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/card-display-rules",
    payload: {
      conditions: {
        type: "group",
        combinator: "and",
        children: [],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/card-display-rules rejects a payload missing the conditions", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/card-display-rules",
    payload: {
      name: "Rule",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/card-display-rules rejects an unknown imageVisibility", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/card-display-rules",
    payload: {
      name: "Rule",
      conditions: {
        type: "group",
        combinator: "and",
        children: [],
      },
      imageVisibility: "sometimes",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/card-display-rules/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/card-display-rules/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/card-display-rules/reorder rejects a non-uuid in orderedIds", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/card-display-rules/reorder",
    payload: {
      orderedIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/card-display-rules/reorder rejects a payload missing orderedIds", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/card-display-rules/reorder",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
