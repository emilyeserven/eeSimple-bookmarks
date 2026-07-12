import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { customProperties } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `ensureProgressProperty` is exercised against the shared in-memory fake `db` (`testDbHelpers.ts`).
 * `mock.module` swaps `@/db` before the service module is first imported. These tests focus on the
 * source-link REPAIR: an existing built-in "Progress" row whose derive-from-Sections link is absent
 * (the old manual "Page Progress" renamed to "Progress" kept a null source) must be re-linked, while
 * a row that already points somewhere is left untouched.
 */

const propertyRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  propertyRows.length = 0;
  propertyRows.push(...rows);
}

const db = createFakeDb([{
  table: customProperties,
  rows: propertyRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  ensureProgressProperty,
} = await import("@/services/customProperties");

test.beforeEach(() => {
  resetRows();
});

test("ensureProgressProperty: fills an absent (null) source link on the existing built-in Progress row", async () => {
  resetRows([{
    id: "prog-1",
    slug: "progress",
    builtIn: true,
    type: "itemInItems",
    itemInItemsSourcePropertyId: null,
  }]);

  const id = await ensureProgressProperty("sections-id");
  assert.equal(id, "prog-1");
  const row = propertyRows.find(r => r.id === "prog-1");
  assert.equal(row?.itemInItemsSourcePropertyId, "sections-id");
});

test("ensureProgressProperty: does NOT overwrite a non-null (user/fresh-install) source link", async () => {
  resetRows([{
    id: "prog-1",
    slug: "progress",
    builtIn: true,
    type: "itemInItems",
    itemInItemsSourcePropertyId: "custom-source",
  }]);

  await ensureProgressProperty("sections-id");
  const row = propertyRows.find(r => r.id === "prog-1");
  assert.equal(row?.itemInItemsSourcePropertyId, "custom-source");
});

test("ensureProgressProperty: leaves the null link alone when there is no Sections property to link to", async () => {
  resetRows([{
    id: "prog-1",
    slug: "progress",
    builtIn: true,
    type: "itemInItems",
    itemInItemsSourcePropertyId: null,
  }]);

  await ensureProgressProperty(null);
  const row = propertyRows.find(r => r.id === "prog-1");
  assert.equal(row?.itemInItemsSourcePropertyId, null);
});
