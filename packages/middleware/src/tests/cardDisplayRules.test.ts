import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Column, is, Param, SQL } from "drizzle-orm";

/**
 * `backfillCardDisplayRuleSecondaryNameField` (services/cardDisplayRules.ts) is exercised against a
 * tiny in-memory fake `db`, mirroring the mocking approach in `taxonomyImages.test.ts` (this suite
 * has no live-Postgres harness). `mock.module` swaps `@/db` before the service module is first
 * imported (ES module imports are cached process-wide), so the mocks must be installed up front.
 */

interface FakeRow {
  id: string;
  fieldZones: Record<string, { key: string }[]> | null;
}

/** Flatten an `eq(col, val)` condition into `{ columnName: value }`. */
function extractEqFilters(condition: unknown): Record<string, unknown> {
  const flat: ({ kind: "col";
    name: string; } | { kind: "val";
      value: unknown; })[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (is(node, Column)) {
      flat.push({
        kind: "col",
        name: node.name,
      });
      return;
    }
    if (is(node, Param)) {
      flat.push({
        kind: "val",
        value: node.value,
      });
      return;
    }
    if (node instanceof SQL && Array.isArray(node.queryChunks)) {
      for (const chunk of node.queryChunks) walk(chunk);
    }
  };
  walk(condition);

  const filters: Record<string, unknown> = {};
  for (let i = 0; i < flat.length - 1; i++) {
    const col = flat[i];
    const val = flat[i + 1];
    if (col.kind === "col" && val.kind === "val") filters[col.name] = val.value;
  }
  return filters;
}

// Shared, mutable fixtures — reset at the top of each test. The fake `db` below closes over these
// by reference, so the array is never reassigned, only replaced in place.
const rows: FakeRow[] = [];
const updatedIds: string[] = [];

function resetRows(next: FakeRow[]): void {
  rows.length = 0;
  rows.push(...next);
  updatedIds.length = 0;
}

/** A minimal stand-in for the drizzle `db` supporting only the chains this backfill uses. */
const fakeDb = {
  select: () => ({
    from: () => Promise.resolve(rows.map(row => ({
      ...row,
    }))),
  }),
  update: () => ({
    set: (patch: { fieldZones: Record<string, { key: string }[]> }) => ({
      where: (cond: unknown) => {
        const filters = extractEqFilters(cond);
        const id = filters.id as string;
        const row = rows.find(r => r.id === id);
        if (row) {
          row.fieldZones = patch.fieldZones;
          updatedIds.push(id);
        }
        return Promise.resolve(undefined);
      },
    }),
  }),
};

mock.module("@/db", {
  namedExports: {
    db: fakeDb,
  },
});

const {
  backfillCardDisplayRuleSecondaryNameField,
} = await import("@/services/cardDisplayRules");

test("backfillCardDisplayRuleSecondaryNameField rewrites a legacy romanizedName placement to secondaryName", async () => {
  resetRows([
    {
      id: "rule-1",
      fieldZones: {
        "card-single-top": [{
          key: "title",
        }, {
          key: "romanizedName",
        }],
        "card-labels": [{
          key: "category",
        }],
      },
    },
  ]);

  await backfillCardDisplayRuleSecondaryNameField();

  assert.deepEqual(updatedIds, ["rule-1"]);
  const zones = rows[0].fieldZones!;
  assert.deepEqual(zones["card-single-top"].map(p => p.key), ["title", "secondaryName"]);
  // Untouched zones are preserved.
  assert.deepEqual(zones["card-labels"].map(p => p.key), ["category"]);
});

test("backfillCardDisplayRuleSecondaryNameField rewrites the legacy romanizedTitle key too", async () => {
  resetRows([
    {
      id: "rule-1",
      fieldZones: {
        "card-single-top": [{
          key: "romanizedTitle",
        }],
      },
    },
  ]);

  await backfillCardDisplayRuleSecondaryNameField();

  assert.deepEqual(rows[0].fieldZones!["card-single-top"].map(p => p.key), ["secondaryName"]);
});

test("backfillCardDisplayRuleSecondaryNameField appends secondaryName to its default zone when the rule predates it entirely", async () => {
  resetRows([
    {
      id: "rule-1",
      fieldZones: {
        "card-single-top": [{
          key: "title",
        }],
        "card-labels": [{
          key: "category",
        }],
      },
    },
  ]);

  await backfillCardDisplayRuleSecondaryNameField();

  assert.deepEqual(updatedIds, ["rule-1"]);
  const zones = rows[0].fieldZones!;
  // secondaryName defaults to card-single-top (see cardDisplayDefaults.test.ts).
  assert.deepEqual(zones["card-single-top"].map(p => p.key), ["title", "secondaryName"]);
});

test("backfillCardDisplayRuleSecondaryNameField is idempotent — a rule already carrying secondaryName is skipped", async () => {
  resetRows([
    {
      id: "rule-1",
      fieldZones: {
        "card-single-top": [{
          key: "title",
        }, {
          key: "secondaryName",
        }],
      },
    },
  ]);

  await backfillCardDisplayRuleSecondaryNameField();

  assert.deepEqual(updatedIds, []);
});

test("backfillCardDisplayRuleSecondaryNameField leaves an inheriting rule (fieldZones null) untouched", async () => {
  resetRows([
    {
      id: "rule-1",
      fieldZones: null,
    },
  ]);

  await backfillCardDisplayRuleSecondaryNameField();

  assert.deepEqual(updatedIds, []);
  assert.equal(rows[0].fieldZones, null);
});
