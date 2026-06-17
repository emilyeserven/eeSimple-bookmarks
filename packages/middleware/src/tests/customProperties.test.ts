import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { sumOperands } from "@/services/bookmarks";

// Pure-helper tests run without a live database, matching the `tags` test style.

test("sumOperands adds the operand values, treating a missing value as 0", () => {
  const values = new Map([
    ["a", 8],
    ["b", 3],
  ]);
  assert.equal(sumOperands(values, ["a", "b"]), 11);
  assert.equal(sumOperands(values, ["a", "missing"]), 8);
  assert.equal(sumOperands(values, []), 0);
});

// Schema-validation tests via `inject` (no database needed).

test("POST /api/custom-properties rejects a payload missing the type", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-properties",
    payload: {
      name: "Priority",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-properties rejects an unknown type", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-properties",
    payload: {
      name: "Priority",
      type: "color",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-properties rejects the removed tiered_tags type", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-properties",
    payload: {
      name: "Topic",
      type: "tiered_tags",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-properties accepts the boolean and calculate types (schema)", async () => {
  const app = await buildApp();
  for (const type of ["number", "boolean", "calculate"]) {
    const res = await app.inject({
      method: "POST",
      url: "/api/custom-properties",
      // A non-uuid operand still passes schema for `boolean`/`number`; for `calculate`
      // we only assert the type itself is accepted by the enum (not a 400 schema error).
      payload: {
        name: `Prop ${type}`,
        type,
      },
    });
    assert.notEqual(res.statusCode, 400, `type ${type} should pass schema validation`);
  }
  await app.close();
});

test("PATCH /api/custom-properties/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/custom-properties/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
