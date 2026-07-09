import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookmarkNumberValues,
  bookmarkTags,
  calculatePropertyOperands,
  customProperties,
} from "@/db/schema";
import {
  linkGenreMoods,
  linkLocations,
  linkTags,
  recomputeCalculatedValues,
  setNumberValues,
  type Tx,
} from "@/services/bookmarkWrites";

// Every export here takes `tx: Tx` explicitly, so a hand-built fake transaction can be passed
// directly — no `mock.module("@/db", ...)` needed (unlike services that reach for the module-level
// `db` singleton themselves). `sumOperands` is pure and already covered by customProperties.test.ts;
// it isn't retested here. The ~14 `link*`/`set*` writers share one guard-clause/insert shape
// (empty/undefined array → no-op, else a single `tx.insert(table).values(rows)`); only a
// representative couple plus the two dedup-specific ones (`linkGenreMoods`/`linkLocations`) are
// covered — the rest are structurally identical one-liners.

interface FakeTxState {
  inserted: { table: unknown;
    rows: unknown[]; }[];
  calls: string[];
  tableRows: Map<unknown, unknown[]>;
}

function makeFakeTx(): { tx: Tx;
  state: FakeTxState; } {
  const state: FakeTxState = {
    inserted: [],
    calls: [],
    tableRows: new Map(),
  };
  const tx = {
    insert: (table: unknown) => ({
      values: (rows: unknown[]) => {
        state.inserted.push({
          table,
          rows,
        });
        state.calls.push("insert");
        return Promise.resolve(undefined);
      },
    }),
    delete: (table: unknown) => ({
      where: () => {
        state.calls.push("delete");
        return Promise.resolve(undefined);
      },
    }),
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          state.calls.push("select");
          return Promise.resolve(state.tableRows.get(table) ?? []);
        },
      }),
    }),
  } as unknown as Tx;
  return {
    tx,
    state,
  };
}

test("linkTags is a no-op for undefined or empty tag ids", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await linkTags(tx, "bm-1", undefined);
  await linkTags(tx, "bm-1", []);
  assert.deepEqual(state.inserted, []);
});

test("linkTags inserts one row per tag id", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await linkTags(tx, "bm-1", ["t1", "t2"]);
  assert.equal(state.inserted.length, 1);
  assert.equal(state.inserted[0].table, bookmarkTags);
  assert.deepEqual(state.inserted[0].rows, [
    {
      bookmarkId: "bm-1",
      tagId: "t1",
    },
    {
      bookmarkId: "bm-1",
      tagId: "t2",
    },
  ]);
});

test("setNumberValues is a no-op for undefined or empty values", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await setNumberValues(tx, "bm-1", undefined);
  await setNumberValues(tx, "bm-1", []);
  assert.deepEqual(state.inserted, []);
});

test("linkGenreMoods de-duplicates repeated ids and writes taxonomy_assignments for the G&M taxonomy", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await linkGenreMoods(tx, "bm-1", ["g1", "g1", "g2"], "gm-tax");
  assert.equal(state.inserted.length, 1);
  assert.deepEqual(state.inserted[0].rows, [
    {
      taxonomyId: "gm-tax",
      termId: "g1",
      ownerType: "bookmark",
      ownerId: "bm-1",
    },
    {
      taxonomyId: "gm-tax",
      termId: "g2",
      ownerType: "bookmark",
      ownerId: "bm-1",
    },
  ]);
});

test("linkGenreMoods no-ops when the G&M taxonomy has been demoted away (null id)", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await linkGenreMoods(tx, "bm-1", ["g1"], null);
  assert.deepEqual(state.inserted, []);
});

test("linkLocations de-duplicates location ids while still mapping each to its relation id", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  await linkLocations(tx, "bm-1", ["l1", "l1", "l2"], {
    l1: "rel-1",
  });
  assert.equal(state.inserted.length, 1);
  assert.deepEqual(state.inserted[0].rows, [
    {
      bookmarkId: "bm-1",
      locationId: "l1",
      locationRelationId: "rel-1",
    },
    {
      bookmarkId: "bm-1",
      locationId: "l2",
      locationRelationId: null,
    },
  ]);
});

test("recomputeCalculatedValues is a no-op when there are no calculate-type properties", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  state.tableRows.set(customProperties, []);
  await recomputeCalculatedValues(tx, "bm-1");
  assert.deepEqual(state.calls, ["select"]);
  assert.deepEqual(state.inserted, []);
});

test("recomputeCalculatedValues stores a 0 result for a calculate property with no operand values yet", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  state.tableRows.set(customProperties, [{
    id: "calc-1",
  }]);
  state.tableRows.set(calculatePropertyOperands, [{
    propertyId: "calc-1",
    operandPropertyId: "op-1",
  }]);
  state.tableRows.set(bookmarkNumberValues, []);
  await recomputeCalculatedValues(tx, "bm-1");
  assert.equal(state.inserted.length, 1);
  assert.equal(state.inserted[0].table, bookmarkNumberValues);
  assert.deepEqual(state.inserted[0].rows, [{
    bookmarkId: "bm-1",
    propertyId: "calc-1",
    value: 0,
  }]);
});

test("recomputeCalculatedValues sums the operand property values", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  state.tableRows.set(customProperties, [{
    id: "calc-1",
  }]);
  state.tableRows.set(calculatePropertyOperands, [
    {
      propertyId: "calc-1",
      operandPropertyId: "op-1",
    },
    {
      propertyId: "calc-1",
      operandPropertyId: "op-2",
    },
  ]);
  state.tableRows.set(bookmarkNumberValues, [
    {
      propertyId: "op-1",
      value: 8,
    },
    {
      propertyId: "op-2",
      value: 3,
    },
  ]);
  await recomputeCalculatedValues(tx, "bm-1");
  assert.deepEqual(state.inserted[0].rows, [{
    bookmarkId: "bm-1",
    propertyId: "calc-1",
    value: 11,
  }]);
});

test("recomputeCalculatedValues clears stale calculate results before re-reading operand values", async () => {
  const {
    tx, state,
  } = makeFakeTx();
  state.tableRows.set(customProperties, [{
    id: "calc-1",
  }]);
  state.tableRows.set(calculatePropertyOperands, []);
  state.tableRows.set(bookmarkNumberValues, []);
  await recomputeCalculatedValues(tx, "bm-1");
  // delete (stale calc values) must happen before the re-read select of bookmarkNumberValues.
  const deleteIndex = state.calls.indexOf("delete");
  const secondSelectIndex = state.calls.lastIndexOf("select");
  assert.ok(deleteIndex >= 0, "delete should have been called");
  assert.ok(deleteIndex < secondSelectIndex, "delete must precede the operand-value re-read");
});
