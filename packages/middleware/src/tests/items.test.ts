import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { items } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/items.ts` exercised against the shared in-memory fake `db` (`testDbHelpers.ts`) — there
 * is no live-Postgres harness. `mock.module` swaps `@/db` before the service module is first
 * imported (ESM import caching), so the mock must be installed up front and the service imported
 * dynamically afterwards. This is the reference recipe for a DB-touching service test.
 */

// Mutable, never-reassigned fixture array — the fake `db` closes over it by reference.
const itemRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  itemRows.length = 0;
  itemRows.push(...rows);
}

const db = createFakeDb([
  {
    table: items,
    rows: itemRows,
  },
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  createItem, deleteItem, getItem, updateItem,
} = await import("@/services/items");

function row(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "item-1",
    name: "First",
    slug: "first",
    description: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

test("createItem derives a unique slug from the name", async () => {
  resetRows([row({})]);
  const created = await createItem({
    name: "First!",
  });
  assert.equal(created.slug, "first-2");
  assert.equal(itemRows.length, 2);
});

test("createItem rejects a duplicate name with a 409 duplicateName error", async () => {
  resetRows([row({})]);
  await assert.rejects(createItem({
    name: "First",
  }), {
    code: "duplicateName",
    statusCode: 409,
  });
});

test("updateItem renames and re-slugs", async () => {
  resetRows([row({})]);
  const updated = await updateItem("item-1", {
    name: "Renamed",
  });
  assert.equal(updated.name, "Renamed");
  assert.equal(updated.slug, "renamed");
});

test("getItem / deleteItem throw notFound for a missing id", async () => {
  resetRows();
  await assert.rejects(getItem("missing"), {
    code: "notFound",
  });
  await assert.rejects(deleteItem("missing"), {
    code: "notFound",
  });
});
