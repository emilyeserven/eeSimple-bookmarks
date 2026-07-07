import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { emptyConditionTree } from "@eesimple/types";
import { importRules } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/importRules.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 */

const importRuleRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  importRuleRows.length = 0;
  importRuleRows.push(...rows);
}

const db = createFakeDb([{
  table: importRules,
  rows: importRuleRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  applyImportRules,
  deleteImportRule,
} = await import("@/services/importRules");

test.beforeEach(() => {
  resetRows();
});

test("deleteImportRule: a missing id returns false", async () => {
  const deleted = await deleteImportRule("nonexistent-id");
  assert.equal(deleted, false);
});

test("deleteImportRule: removes the row", async () => {
  resetRows([{
    id: "rule-1",
    name: "Auto-tag YouTube",
    slug: "auto-tag-youtube",
    conditions: emptyConditionTree(),
    action: {
      setCategoryId: "cat-1",
    },
    sortOrder: 0,
  }]);

  const deleted = await deleteImportRule("rule-1");
  assert.equal(deleted, true);
  assert.equal(importRuleRows.some(row => row.id === "rule-1"), false);
});

function urlOnlyConditions(pattern: string) {
  return {
    type: "group" as const,
    combinator: "and" as const,
    children: [{
      type: "match" as const,
      field: "url" as const,
      operator: "contains" as const,
      pattern,
    }],
  };
}

test("applyImportRules: a matching rule returns its action", async () => {
  resetRows([{
    id: "rule-1",
    name: "YouTube",
    slug: "youtube",
    conditions: urlOnlyConditions("youtube.com"),
    action: {
      setCategoryId: "cat-video",
    },
    sortOrder: 0,
  }]);

  const action = await applyImportRules({
    url: "https://youtube.com/watch?v=abc",
    title: "A video",
  });

  assert.deepEqual(action, {
    setCategoryId: "cat-video",
  });
});

test("applyImportRules: no matching rule returns null", async () => {
  resetRows([{
    id: "rule-1",
    name: "YouTube",
    slug: "youtube",
    conditions: urlOnlyConditions("youtube.com"),
    action: {
      setCategoryId: "cat-video",
    },
    sortOrder: 0,
  }]);

  const action = await applyImportRules({
    url: "https://example.com/article",
    title: "An article",
  });

  assert.equal(action, null);
});

test("applyImportRules: first match wins by sortOrder", async () => {
  resetRows([
    {
      id: "rule-later",
      name: "Generic web",
      slug: "generic-web",
      conditions: urlOnlyConditions("example.com"),
      action: {
        setCategoryId: "cat-generic",
      },
      sortOrder: 1,
    },
    {
      id: "rule-earlier",
      name: "Specific blog",
      slug: "specific-blog",
      conditions: urlOnlyConditions("example.com/blog"),
      action: {
        setCategoryId: "cat-blog",
      },
      sortOrder: 0,
    },
  ]);

  const action = await applyImportRules({
    url: "https://example.com/blog/post-1",
    title: "A post",
  });

  assert.deepEqual(action, {
    setCategoryId: "cat-blog",
  });
});
