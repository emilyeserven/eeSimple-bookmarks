import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/homepage-sections rejects a payload missing the title", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/homepage-sections",
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

test("POST /api/homepage-sections rejects a payload missing the conditions", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/homepage-sections",
    payload: {
      title: "Recent",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/homepage-sections rejects an unknown imageLayout", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/homepage-sections",
    payload: {
      title: "Recent",
      conditions: {
        type: "group",
        combinator: "and",
        children: [],
      },
      imageLayout: "below",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/homepage-sections rejects an unknown viewMode", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/homepage-sections",
    payload: {
      title: "Recent",
      conditions: {
        type: "group",
        combinator: "and",
        children: [],
      },
      viewMode: "grid",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/homepage-sections/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/homepage-sections/not-a-uuid",
    payload: {
      title: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/homepage-sections/reorder rejects a non-uuid in orderedIds", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/homepage-sections/reorder",
    payload: {
      orderedIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
