import assert from "node:assert/strict";
import { test } from "node:test";
import type { CustomPropertyTag } from "@eesimple/types";
import { buildApp } from "@/app";
import { buildPropertyTagTree } from "@/services/customProperties";
import { collectSubtreeIds, wouldCreateCycle } from "@/services/tags";

// Pure-helper tests run without a live database, matching the `tags` test style.

const flat: CustomPropertyTag[] = [
  {
    id: "low",
    propertyId: "prio",
    name: "low",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "high",
    propertyId: "prio",
    name: "high",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "urgent",
    propertyId: "prio",
    name: "urgent",
    parentId: "high",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

test("buildPropertyTagTree nests children under their parents", () => {
  const roots = buildPropertyTagTree(flat);
  assert.equal(roots.length, 2); // low, high
  const high = roots.find(node => node.id === "high");
  assert.ok(high);
  assert.equal(high.children[0]?.id, "urgent");
});

test("collectSubtreeIds works on property tags (inclusive of descendants)", () => {
  assert.deepEqual([...collectSubtreeIds(flat, "high")].sort(), ["high", "urgent"]);
  assert.deepEqual([...collectSubtreeIds(flat, "low")], ["low"]);
});

test("wouldCreateCycle rejects reparenting a property tag under its descendant", () => {
  assert.equal(wouldCreateCycle(flat, "high", "urgent"), true);
  assert.equal(wouldCreateCycle(flat, "high", "low"), false);
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

test("PATCH /api/custom-properties/:id/tags/:tagId rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/custom-properties/not-a-uuid/tags/also-not",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
