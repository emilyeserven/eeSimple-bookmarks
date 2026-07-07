/**
 * A tiny in-memory stand-in for the Drizzle `db` singleton, shared by the test files that need to
 * exercise a service touching several tables without a live Postgres. Fixture rows are registered
 * per table (by Drizzle table-object identity, e.g. `schema.bookmarkTags`, which is unique
 * regardless of how the real query joins/filters/orders it) rather than by interpreting real SQL —
 * the services under test do their grouping/precedence/dedup in JS *after* the query runs, so a
 * fixture-per-table fake exercises that logic directly without needing to reimplement `inArray`/
 * `orderBy`/join semantics.
 *
 * Usage: call `mock.module("@/db", { namedExports: { db } })` with the returned `db` *before*
 * dynamically importing the module under test (ES module imports are cached process-wide).
 */

export interface FakeDbHandle {
  db: unknown;
  /** Register (or replace) the fixture rows a `select().from(table)...` should resolve to. */
  setRows: (table: unknown, rows: unknown[]) => void;
  /** Clear all fixtures and recorded insert/delete calls between tests. */
  reset: () => void;
  /** Every `insert(table).values(rows)` call made against the fake, in order. */
  inserted: { table: unknown;
    rows: unknown[]; }[];
  /** Every `delete(table).where(...)` call made against the fake, in order. */
  deleted: { table: unknown }[];
}

export function createFakeDb(): FakeDbHandle {
  const rowsByTable = new Map<unknown, unknown[]>();
  const inserted: { table: unknown;
    rows: unknown[]; }[] = [];
  const deleted: { table: unknown }[] = [];

  /**
   * A chainable, awaitable node: every chain method (`where`/`leftJoin`/`orderBy`/…) returns another
   * node resolving to the same value, and the node is itself a thenable so a caller can `await` it
   * at whatever point it stops chaining (different call sites stop at different methods).
   */
  function node(resolve: () => unknown): PromiseLike<unknown> & Record<string, unknown> {
    const self: PromiseLike<unknown> & Record<string, unknown> = {
      where: () => self,
      leftJoin: () => self,
      innerJoin: () => self,
      orderBy: () => self,
      limit: () => self,
      returning: () => node(resolve),
      onConflictDoNothing: () => self,
      then: <TResult1, TResult2 = never>(
        onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
        onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) => Promise.resolve(resolve()).then(onFulfilled, onRejected),
    };
    return self;
  }

  const db = {
    select: () => ({
      from: (table: unknown) => node(() => rowsByTable.get(table) ?? []),
    }),
    insert: (table: unknown) => ({
      values: (rows: unknown[]) => {
        inserted.push({
          table,
          rows,
        });
        return node(() => rows);
      },
    }),
    delete: (table: unknown) => ({
      where: () => {
        deleted.push({
          table,
        });
        return node(() => rowsByTable.get(table) ?? []);
      },
    }),
    transaction: async (cb: (tx: unknown) => unknown) => cb(db),
  };

  return {
    db,
    setRows: (table, rows) => {
      rowsByTable.set(table, rows);
    },
    reset: () => {
      rowsByTable.clear();
      inserted.length = 0;
      deleted.length = 0;
    },
    inserted,
    deleted,
  };
}
