import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { taxonomyAssignments, languages } from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/languages.ts` is exercised against the shared in-memory fake `db` (`testDbHelpers.ts`) —
 * this suite has no live-Postgres harness. `mock.module` swaps `@/db` before the service module is
 * first imported (ESM import caching), so the mock must be installed up front.
 */

const languageRows: Record<string, unknown>[] = [];
const taxonomyAssignmentRows: Record<string, unknown>[] = [];

function resetRows(opts: {
  languages?: Record<string, unknown>[];
  taxonomyAssignments?: Record<string, unknown>[];
} = {}): void {
  resetFakeIds();
  languageRows.length = 0;
  languageRows.push(...(opts.languages ?? []));
  taxonomyAssignmentRows.length = 0;
  taxonomyAssignmentRows.push(...(opts.taxonomyAssignments ?? []));
}

const db = createFakeDb([
  {
    table: languages,
    rows: languageRows,
  },
  {
    table: taxonomyAssignments,
    rows: taxonomyAssignmentRows,
  },
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  BuiltInLanguageError,
  createLanguage,
  DuplicateLanguageError,
  deleteLanguage,
} = await import("@/services/languages");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("deleteLanguage: a built-in cannot be deleted", async () => {
  resetRows({
    languages: [{
      id: "lang-en",
      name: "English",
      isoCode: "en",
      builtIn: true,
    }],
  });

  await assert.rejects(() => deleteLanguage("lang-en"), BuiltInLanguageError);
  assert.equal(languageRows.some(row => row.id === "lang-en"), true);
});

test("deleteLanguage: a missing id returns false with no side effects", async () => {
  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteLanguage("nonexistent-id");
  assert.equal(deleted, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("deleteLanguage: deleting a custom language cleans up its genre/mood assignments and invalidates the cache (its language_usages rows cascade-delete, no manual cleanup call)", async () => {
  resetRows({
    languages: [{
      id: "lang-custom",
      name: "Klingon",
      isoCode: null,
      builtIn: false,
    }],
    taxonomyAssignments: [
      {
        id: "gma-1",
        ownerType: "language",
        ownerId: "lang-custom",
        genreMoodId: "gm-1",
      },
      {
        id: "gma-2",
        ownerType: "bookmark",
        ownerId: "bm-1",
        genreMoodId: "gm-1",
      },
    ],
  });

  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteLanguage("lang-custom");
  assert.equal(deleted, true);
  assert.equal(languageRows.some(row => row.id === "lang-custom"), false);
  assert.deepEqual(taxonomyAssignmentRows.map(row => row.id), ["gma-2"]);
  assert.equal(bookmarkCacheVersion(), versionBefore + 1);
});

test("createLanguage: dedupes on name", async () => {
  resetRows({
    languages: [{
      id: "lang-existing",
      name: "Klingon",
      isoCode: null,
      builtIn: false,
    }],
  });

  await assert.rejects(() => createLanguage({
    name: "Klingon",
  }), DuplicateLanguageError);
});

test("createLanguage: dedupes on isoCode even when the name differs", async () => {
  resetRows({
    languages: [{
      id: "lang-existing",
      name: "Klingon",
      isoCode: "tlh",
      builtIn: false,
    }],
  });

  await assert.rejects(() => createLanguage({
    name: "Klingonese",
    isoCode: "tlh",
  }), DuplicateLanguageError);
});
