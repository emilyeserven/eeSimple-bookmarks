import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { parseTemplates } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/parseTemplates.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`). `mock.module` swaps `@/db` before the service module is first imported
 * (ESM import caching), so the mock is installed up front.
 */

const parseTemplateRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  parseTemplateRows.length = 0;
  parseTemplateRows.push(...rows);
}

const db = createFakeDb([{
  table: parseTemplates,
  rows: parseTemplateRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  createParseTemplate,
  updateParseTemplate,
  deleteParseTemplate,
  listParseTemplates,
} = await import("@/services/parseTemplates");

test.beforeEach(() => {
  resetRows();
});

test("createParseTemplate: persists the fields and defaults fallbackTag", async () => {
  const created = await createParseTemplate({
    name: "Author - Title",
    delineator: " / ",
    pattern: "{{person}} - {{name}}",
  });
  assert.equal(created.name, "Author - Title");
  assert.equal(created.delineator, " / ");
  assert.equal(created.pattern, "{{person}} - {{name}}");
  assert.equal(created.fallbackTag, "name");
  assert.equal(created.description, null);
});

test("updateParseTemplate: patches only provided fields", async () => {
  resetRows([{
    id: "pt-1",
    name: "Old",
    description: null,
    delineator: " / ",
    pattern: "{{name}}",
    fallbackTag: "name",
  }]);

  const updated = await updateParseTemplate("pt-1", {
    pattern: "{{person}} - {{name}}",
    fallbackTag: "person",
  });
  assert.equal(updated?.pattern, "{{person}} - {{name}}");
  assert.equal(updated?.fallbackTag, "person");
  assert.equal(updated?.name, "Old");
});

test("updateParseTemplate: a missing id returns null", async () => {
  const updated = await updateParseTemplate("nope", {
    name: "x",
  });
  assert.equal(updated, null);
});

test("deleteParseTemplate: removes the row", async () => {
  resetRows([{
    id: "pt-1",
    name: "A",
    delineator: " / ",
    pattern: "{{name}}",
    fallbackTag: "name",
  }]);
  const deleted = await deleteParseTemplate("pt-1");
  assert.equal(deleted, true);
  assert.equal(parseTemplateRows.some(row => row.id === "pt-1"), false);
});

test("deleteParseTemplate: a missing id returns false", async () => {
  assert.equal(await deleteParseTemplate("nope"), false);
});

test("listParseTemplates: returns the rows", async () => {
  resetRows([{
    id: "pt-1",
    name: "A",
    description: null,
    delineator: " / ",
    pattern: "{{name}}",
    fallbackTag: "name",
  }]);
  const list = await listParseTemplates();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, "A");
});
