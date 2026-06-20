import assert from "node:assert/strict";
import { test } from "node:test";
import type { ConditionTree } from "@eesimple/types";
import { buildApp } from "@/app";
import { migrateDomainMatches } from "@/services/autofill";

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

test("POST /api/autofill-rules accepts a website condition (schema)", async () => {
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
          type: "website",
          domains: ["101cookbooks.com"],
        }],
      },
    },
  });
  // No DB in this test, so the handler may 500; we only assert the schema accepted the payload.
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects a website condition missing domains", async () => {
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
          type: "website",
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("migrateDomainMatches rewrites legacy domain matches into website leaves", () => {
  const result = migrateDomainMatches({
    type: "group",
    combinator: "and",
    children: [
      {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "www.101cookbooks.com",
      },
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "ponzu",
      },
    ],
  });
  assert.equal(result.changed, true);
  assert.deepEqual(result.node, {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "website",
        domains: ["101cookbooks.com"],
      },
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "ponzu",
      },
    ],
  });
});

test("migrateDomainMatches leaves trees without a domain match untouched", () => {
  const tree: ConditionTree = {
    type: "group",
    combinator: "and",
    children: [{
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "ponzu",
    }],
  };
  const result = migrateDomainMatches(tree);
  assert.equal(result.changed, false);
  assert.equal(result.node, tree);
});

test("POST /api/autofill-rules/preview rejects a payload missing conditions", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules/preview",
    payload: {
      query: "ponzu",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules/preview rejects an unknown leaf type", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules/preview",
    payload: {
      conditions: {
        type: "group",
        combinator: "and",
        children: [{
          type: "nonsense",
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules/preview rejects a limit above the maximum", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules/preview",
    payload: {
      conditions: validConditions,
      limit: 51,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules/preview accepts a valid conditions/query/limit (schema)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules/preview",
    payload: {
      conditions: validConditions,
      query: "ponzu",
      limit: 10,
    },
  });
  // No DB in this test, so the handler may 500; we only assert the schema accepted the payload.
  assert.notEqual(res.statusCode, 400);
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
      dateTimeValues: [],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/categories/:id/defaults accepts date/time defaults (schema)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/categories/11111111-1111-1111-1111-111111111111/defaults",
    payload: {
      numberValues: [],
      booleanValues: [],
      dateTimeValues: [{
        propertyId: "22222222-2222-2222-2222-222222222222",
        value: "2026-06-15",
      }],
    },
  });
  // No DB in this test, so the handler may 404/500; we only assert the schema accepted the payload.
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules accepts date/time set-values (schema)", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: validConditions,
      dateTimeValues: [{
        propertyId: "22222222-2222-2222-2222-222222222222",
        value: "2026-06-15",
      }],
    },
  });
  // No DB in this test, so the handler may 500; we only assert the schema accepted the payload.
  assert.notEqual(res.statusCode, 400);
  await app.close();
});

test("POST /api/autofill-rules rejects a non-uuid propertyId in dateTimeValues", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/autofill-rules",
    payload: {
      name: "Recipes",
      conditions: validConditions,
      dateTimeValues: [{
        propertyId: "not-a-uuid",
        value: "2026-06-15",
      }],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
