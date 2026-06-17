import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tag } from "@eesimple/types";
import { buildApp } from "@/app";
import { buildTagTree, collectSubtreeIds, wouldCreateCycle } from "@/services/tags";

// Pure-helper tests run without a live database, matching the `isValidUrl` style.

const flat: Tag[] = [
  {
    id: "dev",
    name: "dev",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "tools",
    name: "tools",
    parentId: "dev",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "cli",
    name: "cli",
    parentId: "tools",
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "work",
    name: "work",
    parentId: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

test("collectSubtreeIds returns a tag and all its descendants", () => {
  assert.deepEqual([...collectSubtreeIds(flat, "dev")].sort(), ["cli", "dev", "tools"]);
  assert.deepEqual([...collectSubtreeIds(flat, "tools")].sort(), ["cli", "tools"]);
  assert.deepEqual([...collectSubtreeIds(flat, "cli")], ["cli"]);
});

test("buildTagTree nests children under their parents", () => {
  const roots = buildTagTree(flat);
  assert.equal(roots.length, 2); // dev, work
  const dev = roots.find(node => node.id === "dev");
  assert.ok(dev);
  assert.equal(dev.children[0]?.id, "tools");
  assert.equal(dev.children[0]?.children[0]?.id, "cli");
});

test("wouldCreateCycle rejects reparenting under self or a descendant", () => {
  assert.equal(wouldCreateCycle(flat, "dev", "dev"), true);
  assert.equal(wouldCreateCycle(flat, "dev", "cli"), true);
  assert.equal(wouldCreateCycle(flat, "tools", "cli"), true);
  // Moving into an unrelated subtree is allowed.
  assert.equal(wouldCreateCycle(flat, "tools", "work"), false);
});

// Schema-validation tests via `inject` (no database needed).

test("POST /api/tags rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/tags",
    payload: {
      parentId: null,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/tags/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/tags/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/bookmarks rejects a non-uuid tag filter", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/bookmarks?tag=not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/bookmarks rejects a non-array tagIds", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/bookmarks",
    payload: {
      url: "https://example.com",
      title: "Example",
      tagIds: "dev",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
