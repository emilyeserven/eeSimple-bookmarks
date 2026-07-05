import assert from "node:assert/strict";
import { mock, test } from "node:test";

/**
 * `src/db/migrate.ts` is the runtime-migrations CLI script: importing it (for its exported
 * `shouldBailOnRomanizedDrop` pure helper) also runs its top-level `main()`, which opens a real
 * `pg` connection and would otherwise `process.exit(1)` against this suite's no-live-Postgres
 * harness (see `taxonomyImages.test.ts`/`cardDisplayRules.test.ts` for the same constraint on
 * service modules). `mock.module` swaps `pg` and `drizzle-orm/node-postgres` with no-op stands-in
 * before the first import, so `main()` runs its idempotent no-op-execute path to completion
 * instead of touching a database.
 */

mock.module("pg", {
  defaultExport: {
    Pool: class FakePool {
      end(): Promise<void> {
        return Promise.resolve();
      }
    },
  },
});

mock.module("drizzle-orm/node-postgres", {
  namedExports: {
    drizzle: () => ({
      execute: () => Promise.resolve({
        rows: [],
      }),
    }),
  },
});

const {
  shouldBailOnRomanizedDrop,
} = await import("@/db/migrate");

// shouldBailOnRomanizedDrop (issue #969 Phase A guard): dropping a table's `romanized_name`
// column would silently lose data only when the table still carries romanized values but the
// `entity_names` backfill (issue #966) hasn't populated any rows for that owner type yet.

test("shouldBailOnRomanizedDrop: bails when romanized values exist with no names backfill", () => {
  assert.equal(shouldBailOnRomanizedDrop(true, false), true);
});

test("shouldBailOnRomanizedDrop: does not bail once the names backfill has rows", () => {
  assert.equal(shouldBailOnRomanizedDrop(true, true), false);
});

test("shouldBailOnRomanizedDrop: does not bail when there are no romanized values to lose", () => {
  assert.equal(shouldBailOnRomanizedDrop(false, false), false);
});

test("shouldBailOnRomanizedDrop: does not bail when there are no romanized values, even with names present", () => {
  assert.equal(shouldBailOnRomanizedDrop(false, true), false);
});
