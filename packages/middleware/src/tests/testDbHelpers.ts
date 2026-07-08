import { Column, is, Param, SQL } from "drizzle-orm";

/**
 * Shared scaffolding for testing DB-touching service functions against a tiny in-memory fake `db`
 * (this suite has no live-Postgres harness — see `cardDisplayRules.test.ts`, the original precedent
 * this generalizes). `mock.module("@/db", { namedExports: { db: fakeDb } })` must be called before
 * the service module under test is dynamically imported (ES module imports are cached process-wide).
 *
 * Row objects use the same TS property keys the service code reads/writes (e.g. `categoryId`, not
 * the DB column name `category_id`) — `Column.name` on a drizzle `Column` instance is the *DB*
 * column name, so conditions are resolved back to a TS key via each table's own property map
 * (`buildColumnKeyMap`), not the column's `.name`.
 */

type Row = Record<string, unknown>;

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(getValue: () => T): Thenable<T> {
  return {
    then: <T1, T2 = never>(
      onFulfilled?: ((value: T) => T1 | PromiseLike<T1>) | null,
      onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
    ) => Promise.resolve(getValue()).then(onFulfilled, onRejected),
  };
}

interface EqFilter {
  column: unknown;
  value: unknown;
}

interface ParsedCondition {
  eq: EqFilter[];
  isNull: unknown[];
}

/**
 * Flatten a drizzle condition (`eq`, `and(eq, eq, …)`, `isNull`) into column-object filters. `and()`
 * interleaves its sub-conditions with separator text chunks that this walk skips (only `Column`/
 * `Param` nodes are collected), so `and(eq(a, x), eq(b, y))` and a bare `eq(a, x)` flatten the same
 * way. A `Column` with no adjacent `Param` (as `isNull` produces) is treated as an IS NULL filter.
 */
function parseCondition(condition: unknown): ParsedCondition {
  const flat: ({ kind: "col";
    column: unknown; } | { kind: "val";
      value: unknown; })[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (is(node, Column)) {
      flat.push({
        kind: "col",
        column: node,
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

  const eq: EqFilter[] = [];
  const isNull: unknown[] = [];
  let i = 0;
  while (i < flat.length) {
    const cur = flat[i];
    const next = flat[i + 1];
    if (cur.kind === "col" && next?.kind === "val") {
      eq.push({
        column: cur.column,
        value: next.value,
      });
      i += 2;
    }
    else if (cur.kind === "col") {
      isNull.push(cur.column);
      i += 1;
    }
    else {
      i += 1;
    }
  }
  return {
    eq,
    isNull,
  };
}

/**
 * Collect every interpolated value embedded in a raw `sql\`...\`` template, in template order.
 * Unlike `eq()`/`isNull()` (which wrap their operands in `Param` via `bindIfParam`), the bare `sql`
 * tag interpolates primitive values (string/number/boolean) directly into `queryChunks` — they're
 * only converted to bind parameters when the query is compiled, not when it's built — so a plain
 * primitive leaf is treated as a param too, alongside any already-wrapped `Param` node.
 */
export function extractParams(node: unknown): unknown[] {
  const params: unknown[] = [];
  const walk = (n: unknown): void => {
    if (n == null) return;
    if (is(n, Param)) {
      params.push(n.value);
      return;
    }
    if (n instanceof SQL && Array.isArray(n.queryChunks)) {
      for (const chunk of n.queryChunks) walk(chunk);
      return;
    }
    if (typeof n === "string" || typeof n === "number" || typeof n === "boolean") {
      params.push(n);
    }
  };
  walk(node);
  return params;
}

/** Map each `Column` instance on a table to the TS property key it's assigned to. */
function buildColumnKeyMap(table: unknown): Map<unknown, string> {
  const map = new Map<unknown, string>();
  for (const [key, value] of Object.entries(table as Row)) {
    if (is(value, Column)) map.set(value, key);
  }
  return map;
}

interface OrderCriterion {
  key: string;
  desc: boolean;
}

/**
 * Resolve one `asc(column)`/`desc(column)` criterion (each is `sql\`${column} asc\`` /
 * `sql\`${column} desc\``, per drizzle's implementation) back to a TS property key + direction.
 */
function parseOrderCriterion(node: unknown, keyMap: Map<unknown, string>): OrderCriterion | null {
  if (!(node instanceof SQL) || !Array.isArray(node.queryChunks)) return null;
  let column: unknown = null;
  let desc = false;
  for (const chunk of node.queryChunks) {
    if (is(chunk, Column)) {
      column = chunk;
    }
    else if (chunk && typeof chunk === "object" && Array.isArray((chunk as { value?: unknown }).value)) {
      if ((chunk as { value: string[] }).value.join("").includes("desc")) desc = true;
    }
  }
  if (!column) return null;
  const key = keyMap.get(column);
  return key === undefined
    ? null
    : {
      key,
      desc,
    };
}

function sortRows(rows: Row[], criteria: OrderCriterion[]): Row[] {
  if (criteria.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const criterion of criteria) {
      const av = a[criterion.key];
      const bv = b[criterion.key];
      if (av === bv) continue;
      if (av == null) return criterion.desc ? 1 : -1;
      if (bv == null) return criterion.desc ? -1 : 1;
      const cmp = av < bv ? -1 : 1;
      return criterion.desc ? -cmp : cmp;
    }
    return 0;
  });
}

function rowMatches(row: Row, condition: ParsedCondition | undefined, keyMap: Map<unknown, string>): boolean {
  if (!condition) return true;
  for (const filter of condition.eq) {
    const key = keyMap.get(filter.column);
    if (key !== undefined && row[key] !== filter.value) return false;
  }
  for (const column of condition.isNull) {
    const key = keyMap.get(column);
    if (key !== undefined && row[key] != null) return false;
  }
  return true;
}

export interface FakeTable {
  table: unknown;
  rows: Row[];
}

let autoId = 0;
/** Deterministic id generator for inserted rows that don't supply their own `id`. */
function nextId(): string {
  autoId += 1;
  return `fake-id-${autoId}`;
}

/** Reset the shared auto-id counter — call from a test's `resetRows()` for reproducible ids. */
export function resetFakeIds(): void {
  autoId = 0;
}

/**
 * Build a minimal in-memory `db` stand-in supporting the subset of drizzle's query-builder surface
 * these services' delete/backfill/reassignment paths use: `select().from().where()`,
 * `insert().values().returning()/.onConflictDoNothing()`, `update().set().where().returning()`,
 * `delete().where().returning()`, and `db.transaction(async tx => …)` (the transaction handle is the
 * same fake `db`, since none of the tested paths need real rollback semantics).
 *
 * `execute` is intentionally unimplemented by default — override it (see `languageUsageLevels.test.ts`)
 * to interpret the one raw `sql\`...\`` query `deleteLanguageUsageLevel` issues.
 */
export function createFakeDb(tables: FakeTable[]): Record<string, unknown> {
  const keyMaps = new Map<unknown, Map<unknown, string>>();
  const rowsFor = (table: unknown): Row[] => {
    const found = tables.find(t => t.table === table);
    if (!found) throw new Error("createFakeDb: unregistered table");
    return found.rows;
  };
  const keyMapFor = (table: unknown): Map<unknown, string> => {
    let map = keyMaps.get(table);
    if (!map) {
      map = buildColumnKeyMap(table);
      keyMaps.set(table, map);
    }
    return map;
  };
  const filterOf = (table: unknown, condition: unknown): Row[] => {
    const parsed = condition === undefined ? undefined : parseCondition(condition);
    const keyMap = keyMapFor(table);
    return rowsFor(table).filter(row => rowMatches(row, parsed, keyMap));
  };

  function selectChain(table: unknown, getRows: () => Row[]): Thenable<Row[]> {
    return {
      ...thenable(getRows),
      where: (condition?: unknown) =>
        selectChain(table, () => getRows().filter(row =>
          rowMatches(row, condition === undefined ? undefined : parseCondition(condition), keyMapFor(table)))),
      limit: (n: number) => selectChain(table, () => getRows().slice(0, n)),
      orderBy: (...criteria: unknown[]) => {
        const keyMap = keyMapFor(table);
        const parsed = criteria
          .map(c => parseOrderCriterion(c, keyMap))
          .filter((c): c is OrderCriterion => c !== null);
        return selectChain(table, () => sortRows(getRows(), parsed));
      },
    };
  }

  const fakeDb: Record<string, unknown> = {
    select: (_cols?: unknown) => ({
      from: (table: unknown) => selectChain(table, () => rowsFor(table).map(row => ({
        ...row,
      }))),
    }),
    insert: (table: unknown) => ({
      values: (input: Row | Row[]) => {
        const list = Array.isArray(input) ? input : [input];
        const inserted = list.map(values => ({
          id: nextId(),
          ...values,
        }));
        return {
          onConflictDoNothing: (_opts?: unknown) => {
            const rows = rowsFor(table);
            const added = inserted.filter(row =>
              !rows.some(existing => "slug" in row && existing.slug === row.slug));
            rows.push(...added);
            return thenable(() => added.map(row => ({
              ...row,
            })));
          },
          returning: (_cols?: unknown) => {
            rowsFor(table).push(...inserted);
            return thenable(() => inserted.map(row => ({
              ...row,
            })));
          },
          ...thenable(() => {
            rowsFor(table).push(...inserted);
            return undefined;
          }),
        };
      },
    }),
    update: (table: unknown) => ({
      set: (patch: Row) => ({
        where: (condition?: unknown) => {
          const matched = filterOf(table, condition);
          for (const row of matched) Object.assign(row, patch);
          return {
            returning: (_cols?: unknown) => thenable(() => matched.map(row => ({
              ...row,
            }))),
            ...thenable(() => undefined),
          };
        },
      }),
    }),
    delete: (table: unknown) => ({
      where: (condition?: unknown) => {
        const rows = rowsFor(table);
        const matched = filterOf(table, condition);
        for (const row of matched) {
          const idx = rows.indexOf(row);
          if (idx >= 0) rows.splice(idx, 1);
        }
        return {
          returning: (_cols?: unknown) => thenable(() => matched.map(row => ({
            ...row,
          }))),
          ...thenable(() => matched),
        };
      },
    }),
    transaction: async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(fakeDb),
    execute: async (_query: unknown): Promise<{ rows: unknown[] }> => {
      throw new Error("createFakeDb: execute() is unimplemented — override it for this test file");
    },
    // Several services build a module-level `SELECT` column map that calls `db.$count(...)` eagerly
    // at import time. The tested delete/backfill paths never select through it, so a placeholder is
    // enough to satisfy that eager evaluation.
    $count: (_table?: unknown, _condition?: unknown) => "fake-count-placeholder",
  };
  return fakeDb;
}
