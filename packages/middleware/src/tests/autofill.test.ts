import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed), matching the
// `categories` / `customProperties` test style.

/** A minimal valid condition tree: one URL-domain match leaf in an AND group. */
const validConditions = {
  type: "group",
  combinator: "and",
  children: [{
    type: "match",
    field: "url",
    operator: "domain",
    pattern: "101cookbooks.com",
  }],
};

test("POST /api/autofill-rules rejects a payload missing conditions", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects an unknown leaf type", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "nonsense",
          pattern: "x",
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects an unknown match operator", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "match",
          field: "url",
          operator: "matches-somehow",
          pattern: "101cookbooks.com",
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects a non-group root", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "101cookbooks.com",
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects a non-uuid category condition id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "category",
          categoryIds: ["not-a-uuid"],
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects a non-uuid setCategoryId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: validConditions,
      setCategoryId: "not-a-uuid",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/autofill-rules/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/autofill-rules/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/categories/:id/defaults rejects a payload missing value arrays", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/categories/11111111-1111-1111-1111-111111111111/defaults",
    payload: {
      numberValues: [],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/categories/:id/defaults rejects a non-uuid propertyId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/categories/11111111-1111-1111-1111-111111111111/defaults",
    payload: {
      numberValues: [{
        propertyId: "not-a-uuid",
        value: 1,
      }],
      booleanValues: [],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
