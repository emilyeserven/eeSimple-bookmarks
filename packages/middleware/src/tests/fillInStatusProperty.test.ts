import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { customProperties } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `ensureFillInStatusProperty` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`). `mock.module` swaps `@/db` before the service module is first imported. These
 * tests cover the two branches of the seed: a fresh install INSERTS the built-in single-select
 * "Fill-in Status" choices property (Not Started / In Progress / Finished, Not Started default,
 * `showInForm: false` so it lands in the Add form's Advanced section), and a subsequent boot is
 * idempotent — re-asserting only the identity flags without clobbering a user's edits.
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
  ensureFillInStatusProperty,
} = await import("@/services/customProperties");

test.beforeEach(() => {
  resetRows();
});

test("ensureFillInStatusProperty: seeds the built-in choices property on a fresh install", async () => {
  await ensureFillInStatusProperty();

  const seeded = propertyRows.filter(r => r.slug === "fill-in-status");
  assert.equal(seeded.length, 1);
  const row = seeded[0];
  assert.equal(row.name, "Fill-in Status");
  assert.equal(row.type, "choices");
  assert.equal(row.builtIn, true);
  assert.equal(row.allCategories, true);
  assert.equal(row.choicesDisplay, "radio");
  assert.equal(row.choicesMultiple, false);
  // Hidden from the create form's main area → surfaces in the Advanced section (like ISBN), not
  // forced-hidden (it is deliberately kept off BOOKMARK_FORM_DETAIL_SLUGS).
  assert.equal(row.showInForm, false);
  assert.equal(row.hiddenFromForm, false);

  const items = row.choicesItems as { label: string;
    value: string;
    isDefault?: boolean; }[];
  assert.deepEqual(items.map(i => i.value), ["not-started", "in-progress", "finished"]);
  assert.deepEqual(items.map(i => i.label), ["Not Started", "In Progress", "Finished"]);
  const defaults = items.filter(i => i.isDefault);
  assert.equal(defaults.length, 1);
  assert.equal(defaults[0]?.value, "not-started");
});

test("ensureFillInStatusProperty: is idempotent — a second boot adds no duplicate row", async () => {
  const first = await ensureFillInStatusProperty();
  const second = await ensureFillInStatusProperty();

  assert.equal(first, second);
  assert.equal(propertyRows.filter(r => r.slug === "fill-in-status").length, 1);
});

test("ensureFillInStatusProperty: re-asserts identity flags but does NOT clobber user edits", async () => {
  resetRows([{
    id: "fis-1",
    slug: "fill-in-status",
    name: "My Renamed Status",
    type: "choices",
    builtIn: false,
    enabled: false,
    allCategories: false,
    choicesItems: [{
      label: "Custom",
      value: "custom",
      isDefault: true,
    }],
  }]);

  const id = await ensureFillInStatusProperty();
  assert.equal(id, "fis-1");
  const row = propertyRows.find(r => r.id === "fis-1");
  // Identity flags are re-asserted so the property can't be orphaned...
  assert.equal(row?.builtIn, true);
  assert.equal(row?.enabled, true);
  assert.equal(row?.allCategories, true);
  // ...but the user's name and choice edits are preserved.
  assert.equal(row?.name, "My Renamed Status");
  assert.deepEqual(row?.choicesItems, [{
    label: "Custom",
    value: "custom",
    isDefault: true,
  }]);
});
