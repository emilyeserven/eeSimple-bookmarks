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
  findInvalidEntityLayouts,
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

test("listEntityLayouts: marks a structurally-invalid row invalid, nulls layout, carries raw + issues", async () => {
  resetRows([{
    id: "el-1",
    entityKind: "custom-property",
    layout: {
      foo: "bar",
    },
    updatedAt: new Date("2026-07-13T12:00:00Z"),
  }]);

  const [record] = await listEntityLayouts();
  assert.equal(record.invalid, true);
  assert.equal(record.layout, null);
  assert.deepEqual(record.rawLayout, {
    foo: "bar",
  });
  assert.ok(record.issues && record.issues.length > 0);
  assert.deepEqual(record.issues, ["tabs is missing or not an array"]);
});

test("listEntityLayouts: leaves a valid row untouched (no invalid/rawLayout/issues)", async () => {
  resetRows([{
    id: "el-1",
    entityKind: "category",
    layout: {
      tabs: [{
        key: "general",
        label: "General",
        sections: [{
          key: "s1",
          fields: ["name"],
        }],
      }],
    },
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  }]);

  const [record] = await listEntityLayouts();
  assert.equal(record.invalid, undefined);
  assert.equal(record.rawLayout, undefined);
  assert.equal(record.issues, undefined);
  assert.ok(record.layout);
});

test("findInvalidEntityLayouts: returns exactly the malformed kinds with their reasons", async () => {
  resetRows([
    {
      id: "el-1",
      entityKind: "custom-property",
      layout: {
        foo: "bar",
      },
      updatedAt: new Date("2026-07-13T12:00:00Z"),
    },
    {
      id: "el-2",
      entityKind: "category",
      layout: {
        tabs: [{
          key: "general",
          label: "General",
          sections: [],
        }],
      },
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    {
      id: "el-3",
      entityKind: "tag",
      layout: null,
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    },
  ]);

  const invalid = await findInvalidEntityLayouts();
  assert.equal(invalid.length, 1);
  assert.equal(invalid[0].kind, "custom-property");
  assert.deepEqual(invalid[0].issues, ["tabs is missing or not an array"]);
});
