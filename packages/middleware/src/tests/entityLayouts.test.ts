import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { entityLayouts } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/entityLayouts.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const rows: Record<string, unknown>[] = [];

function resetRows(seed: Record<string, unknown>[] = []): void {
  resetFakeIds();
  rows.length = 0;
  rows.push(...seed);
}

const db = createFakeDb([{
  table: entityLayouts,
  rows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  deleteEntityLayout,
  listEntityLayouts,
  upsertEntityLayout,
} = await import("@/services/entityLayouts");

test.beforeEach(() => {
  resetRows();
});

test("listEntityLayouts: returns every row, including a null layout", async () => {
  resetRows([
    {
      id: "el-1",
      entityKind: "category",
      layout: {
        tabs: [],
      },
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    {
      id: "el-2",
      entityKind: "tag",
      layout: null,
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    },
  ]);

  const result = await listEntityLayouts();
  assert.equal(result.length, 2);
  assert.deepEqual(result.find(r => r.entityKind === "category")?.layout, {
    tabs: [],
  });
  assert.equal(result.find(r => r.entityKind === "tag")?.layout, null);
});

test("upsertEntityLayout: inserts a new row when none exists for the kind", async () => {
  const layout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [{
        key: "s1",
        fields: ["name"],
      }],
    }],
  };

  const record = await upsertEntityLayout("category", layout);
  assert.equal(record.entityKind, "category");
  assert.deepEqual(record.layout, layout);
  assert.equal(rows.length, 1);
});

test("upsertEntityLayout: updates the existing row in place, no duplicate", async () => {
  resetRows([{
    id: "el-1",
    entityKind: "category",
    layout: {
      tabs: [],
    },
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  }]);

  const newLayout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [],
    }],
  };
  const record = await upsertEntityLayout("category", newLayout);

  assert.equal(rows.length, 1);
  assert.deepEqual(record.layout, newLayout);
  assert.deepEqual(rows[0].layout, newLayout);
});

test("deleteEntityLayout: removes the row and returns true", async () => {
  resetRows([{
    id: "el-1",
    entityKind: "category",
    layout: {
      tabs: [],
    },
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  }]);

  const deleted = await deleteEntityLayout("category");
  assert.equal(deleted, true);
  assert.equal(rows.length, 0);
});

test("deleteEntityLayout: returns false when no row exists for the kind", async () => {
  const deleted = await deleteEntityLayout("category");
  assert.equal(deleted, false);
});
