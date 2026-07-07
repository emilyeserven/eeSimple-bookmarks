import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { languageUsages } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/languageUsages.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 *
 * This is the no-FK cleanup helper other owner services call (see `categories.test.ts`/
 * `groups.test.ts`/`languages.test.ts` for callers); here it's tested as the callee.
 */

const languageUsageRows: Record<string, unknown>[] = [];

function resetRows(rows: Record<string, unknown>[] = []): void {
  resetFakeIds();
  languageUsageRows.length = 0;
  languageUsageRows.push(...rows);
}

const db = createFakeDb([{
  table: languageUsages,
  rows: languageUsageRows,
}]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  deleteLanguageUsagesForOwner,
  setLanguageUsages,
} = await import("@/services/languageUsages");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("setLanguageUsages: delete-then-insert, deduping by (languageId, usageLevelId) and preserving array order as sortOrder", async () => {
  resetRows([{
    id: "existing",
    ownerType: "bookmark",
    ownerId: "bm-1",
    languageId: "lang-old",
    usageLevelId: "level-old",
    translationSourceId: null,
    note: null,
    sortOrder: 0,
  }]);

  await setLanguageUsages("bookmark", "bm-1", [
    {
      languageId: "lang-en",
      usageLevelId: "level-dub",
    },
    {
      languageId: "lang-en",
      usageLevelId: "level-dub",
    },
    {
      languageId: "lang-ja",
      usageLevelId: "level-subs",
    },
  ]);

  assert.equal(languageUsageRows.some(row => row.id === "existing"), false);
  assert.equal(languageUsageRows.length, 2);
  const sorted = [...languageUsageRows].sort((a, b) => (a.sortOrder as number) - (b.sortOrder as number));
  assert.deepEqual(sorted.map(row => [row.languageId, row.usageLevelId]), [
    ["lang-en", "level-dub"],
    ["lang-ja", "level-subs"],
  ]);
  assert.deepEqual(sorted.map(row => row.sortOrder), [0, 1]);
});

test("setLanguageUsages: invalidates the bookmark cache only when the owner is a bookmark", async () => {
  const versionBefore1 = bookmarkCacheVersion();
  await setLanguageUsages("website", "site-1", [{
    languageId: "lang-en",
    usageLevelId: "level-dub",
  }]);
  assert.equal(bookmarkCacheVersion(), versionBefore1);

  const versionBefore2 = bookmarkCacheVersion();
  await setLanguageUsages("bookmark", "bm-1", [{
    languageId: "lang-en",
    usageLevelId: "level-dub",
  }]);
  assert.equal(bookmarkCacheVersion(), versionBefore2 + 1);
});

test("deleteLanguageUsagesForOwner: removes only the targeted owner's rows", async () => {
  resetRows([
    {
      id: "usage-1",
      ownerType: "bookmark",
      ownerId: "bm-1",
      languageId: "lang-en",
      usageLevelId: "level-dub",
    },
    {
      id: "usage-2",
      ownerType: "bookmark",
      ownerId: "bm-2",
      languageId: "lang-en",
      usageLevelId: "level-dub",
    },
    {
      id: "usage-3",
      ownerType: "website",
      ownerId: "bm-1",
      languageId: "lang-en",
      usageLevelId: "level-dub",
    },
  ]);

  await deleteLanguageUsagesForOwner("bookmark", "bm-1");

  assert.deepEqual(languageUsageRows.map(row => row.id).sort(), ["usage-2", "usage-3"]);
});

test("deleteLanguageUsagesForOwner: invalidates the bookmark cache only when the owner is a bookmark", async () => {
  resetRows([{
    id: "usage-1",
    ownerType: "youtubeChannel",
    ownerId: "chan-1",
    languageId: "lang-en",
    usageLevelId: "level-dub",
  }]);

  const versionBefore1 = bookmarkCacheVersion();
  await deleteLanguageUsagesForOwner("youtubeChannel", "chan-1");
  assert.equal(bookmarkCacheVersion(), versionBefore1);

  resetRows([{
    id: "usage-2",
    ownerType: "bookmark",
    ownerId: "bm-1",
    languageId: "lang-en",
    usageLevelId: "level-dub",
  }]);
  const versionBefore2 = bookmarkCacheVersion();
  await deleteLanguageUsagesForOwner("bookmark", "bm-1");
  assert.equal(bookmarkCacheVersion(), versionBefore2 + 1);
});
