import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("PUT /api/homepage-filter rejects a payload missing conditions", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/homepage-filter",
    payload: {},
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/homepage-filter rejects a non-group root", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/homepage-filter",
    payload: {
      conditions: {
        type: "tag",
        tagIds: [],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PUT /api/homepage-filter rejects a malformed property predicate", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/api/homepage-filter",
    payload: {
      conditions: {
        type: "group",
        combinator: "or",
        children: [{
          type: "property",
          propertyId: "11111111-1111-1111-1111-111111111111",
          predicate: {
            valueKind: "number",
            predicate: {
              kind: "range",
            },
          },
        }],
      },
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
