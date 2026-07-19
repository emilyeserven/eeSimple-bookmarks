import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type { CardDisplaySection } from "@eesimple/types";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

// backfillMatchTypeCardField appends the "matchType" field to the Default card-display row's last
// body section, but only when no section already carries it. Pins the append-target, the
// idempotency guard, and the empty/absent-row no-ops against the in-memory fake db.

const fakeDb = createFakeDb();

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});

const {
  backfillMatchTypeCardField,
} = await import("@/services/cardDisplayRules");

function section(key: string, fieldKeys: string[]): CardDisplaySection {
  return {
    key,
    form: "inline",
    layout: {
      mode: "flex",
    },
    fields: fieldKeys.map(k => ({
      key: k,
    })),
  };
}

function setDefaultRow(sections: CardDisplaySection[] | null): void {
  fakeDb.reset();
  fakeDb.setRows(schema.cardDisplayRules, [{
    id: "default-1",
    isDefault: true,
    sections,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
  }]);
}

test("appends matchType to the last body section when absent", async () => {
  setDefaultRow([section("top", ["title"]), section("labels", ["tags", "category"])]);
  await backfillMatchTypeCardField();
  assert.equal(fakeDb.updated.length, 1);
  const next = (fakeDb.updated[0].values as { sections: CardDisplaySection[] }).sections;
  assert.deepEqual(next[0].fields.map(f => f.key), ["title"]);
  assert.deepEqual(next[1].fields.map(f => f.key), ["tags", "category", "matchType"]);
});

test("is idempotent when matchType is already placed in any section", async () => {
  setDefaultRow([section("top", ["title", "matchType"]), section("labels", ["tags"])]);
  await backfillMatchTypeCardField();
  assert.equal(fakeDb.updated.length, 0);
});

test("no-ops when there are no sections or no Default row", async () => {
  setDefaultRow([]);
  await backfillMatchTypeCardField();
  assert.equal(fakeDb.updated.length, 0);

  fakeDb.reset();
  fakeDb.setRows(schema.cardDisplayRules, []);
  await backfillMatchTypeCardField();
  assert.equal(fakeDb.updated.length, 0);
});
