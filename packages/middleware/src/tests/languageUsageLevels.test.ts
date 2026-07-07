import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { languageUsageLevels, languageUsages } from "@/db/schema";
import { createFakeDb, extractParams, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/languageUsageLevels.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 *
 * `deleteLanguageUsageLevel`'s dedup-collision pass runs as one raw `db.execute(sql\`...\`)` query,
 * which `createFakeDb` doesn't interpret generically — `execute` is overridden below to replicate
 * that query's semantics: extract its two embedded parameters (the deleted level id, then the
 * reassignment target id, in template order — the table references embedded in the same template
 * render as identifiers, not parameters, so `extractParams` only picks up the two ids) and drop
 * `language_usages` rows at the deleted level that collide with an existing target-level row for the
 * same `(ownerType, ownerId, languageId)`.
 */

const levelRows: Record<string, unknown>[] = [];
const usageRows: Record<string, unknown>[] = [];

function resetRows(opts: {
  levels?: Record<string, unknown>[];
  usages?: Record<string, unknown>[];
} = {}): void {
  resetFakeIds();
  levelRows.length = 0;
  levelRows.push(...(opts.levels ?? []));
  usageRows.length = 0;
  usageRows.push(...(opts.usages ?? []));
}

const db = createFakeDb([
  {
    table: languageUsageLevels,
    rows: levelRows,
  },
  {
    table: languageUsages,
    rows: usageRows,
  },
]);
db.execute = async (query: unknown): Promise<{ rows: unknown[] }> => {
  const [deletedId, targetId] = extractParams(query);
  const survivors = usageRows.filter((row) => {
    if (row.usageLevelId !== deletedId) return true;
    const collides = usageRows.some(other =>
      other.usageLevelId === targetId
      && other.ownerType === row.ownerType
      && other.ownerId === row.ownerId
      && other.languageId === row.languageId);
    return !collides;
  });
  usageRows.length = 0;
  usageRows.push(...survivors);
  return {
    rows: [],
  };
};

mock.module("@/db", {
  namedExports: {
    db,
  },
});

const {
  BuiltInLanguageUsageLevelError,
  InvalidUsageLevelReassignError,
  backfillLanguageUsageLevelSlugs,
  deleteLanguageUsageLevel,
  ensureBuiltInLanguageUsageLevels,
} = await import("@/services/languageUsageLevels");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows();
});

test("deleteLanguageUsageLevel: a missing id returns false with no writes", async () => {
  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteLanguageUsageLevel("nonexistent-id");
  assert.equal(deleted, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("deleteLanguageUsageLevel: a built-in level cannot be deleted", async () => {
  resetRows({
    levels: [{
      id: "level-dub",
      name: "Dub",
      kind: "availability",
      builtIn: true,
    }],
  });

  await assert.rejects(() => deleteLanguageUsageLevel("level-dub"), BuiltInLanguageUsageLevelError);
});

test("deleteLanguageUsageLevel: reassignToId === id is rejected", async () => {
  resetRows({
    levels: [{
      id: "level-1",
      name: "Custom",
      kind: "availability",
      builtIn: false,
    }],
  });

  await assert.rejects(
    () => deleteLanguageUsageLevel("level-1", "level-1"),
    InvalidUsageLevelReassignError,
  );
});

test("deleteLanguageUsageLevel: a reassignToId pointing at a nonexistent level is rejected", async () => {
  resetRows({
    levels: [{
      id: "level-1",
      name: "Custom",
      kind: "availability",
      builtIn: false,
    }],
  });

  await assert.rejects(
    () => deleteLanguageUsageLevel("level-1", "nonexistent-target"),
    InvalidUsageLevelReassignError,
  );
});

test("deleteLanguageUsageLevel: no reassignToId — every usage at the level is deleted outright", async () => {
  resetRows({
    levels: [{
      id: "level-1",
      name: "Custom",
      kind: "availability",
      builtIn: false,
    }],
    usages: [
      {
        id: "usage-1",
        ownerType: "bookmark",
        ownerId: "bm-1",
        languageId: "lang-en",
        usageLevelId: "level-1",
      },
      {
        id: "usage-2",
        ownerType: "bookmark",
        ownerId: "bm-2",
        languageId: "lang-en",
        usageLevelId: "level-other",
      },
    ],
  });

  const deleted = await deleteLanguageUsageLevel("level-1");
  assert.equal(deleted, true);
  assert.equal(levelRows.some(row => row.id === "level-1"), false);
  assert.deepEqual(usageRows.map(row => row.id), ["usage-2"]);
});

test("deleteLanguageUsageLevel: reassignment with no collision rewrites usageLevelId to the target", async () => {
  resetRows({
    levels: [
      {
        id: "level-1",
        name: "Custom",
        kind: "availability",
        builtIn: false,
      },
      {
        id: "level-2",
        name: "Target",
        kind: "availability",
        builtIn: false,
      },
    ],
    usages: [{
      id: "usage-1",
      ownerType: "bookmark",
      ownerId: "bm-1",
      languageId: "lang-en",
      usageLevelId: "level-1",
    }],
  });

  const deleted = await deleteLanguageUsageLevel("level-1", "level-2");
  assert.equal(deleted, true);
  assert.equal(levelRows.some(row => row.id === "level-1"), false);
  const usage = usageRows.find(row => row.id === "usage-1");
  assert.equal(usage?.usageLevelId, "level-2");
});

test("deleteLanguageUsageLevel: reassignment drops a colliding row instead of duplicating the target-level row", async () => {
  resetRows({
    levels: [
      {
        id: "level-1",
        name: "Custom",
        kind: "availability",
        builtIn: false,
      },
      {
        id: "level-2",
        name: "Target",
        kind: "availability",
        builtIn: false,
      },
    ],
    usages: [
      // bm-1 already carries the target level for lang-en — the deleted-level row for the same
      // (owner, language) collides and must be dropped, not merged into a duplicate.
      {
        id: "usage-deleted-level",
        ownerType: "bookmark",
        ownerId: "bm-1",
        languageId: "lang-en",
        usageLevelId: "level-1",
      },
      {
        id: "usage-target-level",
        ownerType: "bookmark",
        ownerId: "bm-1",
        languageId: "lang-en",
        usageLevelId: "level-2",
      },
      // A different owner has no colliding target-level row, so its deleted-level usage reassigns.
      {
        id: "usage-no-collision",
        ownerType: "bookmark",
        ownerId: "bm-2",
        languageId: "lang-en",
        usageLevelId: "level-1",
      },
    ],
  });

  const deleted = await deleteLanguageUsageLevel("level-1", "level-2");
  assert.equal(deleted, true);

  assert.equal(usageRows.some(row => row.id === "usage-deleted-level"), false);
  const survivingTarget = usageRows.find(row => row.id === "usage-target-level");
  assert.equal(survivingTarget?.usageLevelId, "level-2");
  const reassigned = usageRows.find(row => row.id === "usage-no-collision");
  assert.equal(reassigned?.usageLevelId, "level-2");
  assert.equal(usageRows.length, 2);
});

test("deleteLanguageUsageLevel: invalidates the bookmark cache unconditionally on a successful delete (both branches)", async () => {
  resetRows({
    levels: [{
      id: "level-1",
      name: "Custom",
      kind: "availability",
      builtIn: false,
    }],
  });
  const versionBefore1 = bookmarkCacheVersion();
  await deleteLanguageUsageLevel("level-1");
  assert.equal(bookmarkCacheVersion(), versionBefore1 + 1);

  resetRows({
    levels: [
      {
        id: "level-2",
        name: "Custom 2",
        kind: "availability",
        builtIn: false,
      },
      {
        id: "level-3",
        name: "Target",
        kind: "availability",
        builtIn: false,
      },
    ],
  });
  const versionBefore2 = bookmarkCacheVersion();
  await deleteLanguageUsageLevel("level-2", "level-3");
  assert.equal(bookmarkCacheVersion(), versionBefore2 + 1);
});

test("backfillLanguageUsageLevelSlugs: fills in slugs for levels missing one, leaves existing slugs untouched", async () => {
  resetRows({
    levels: [
      {
        id: "level-no-slug",
        name: "Fan Subtitles",
        kind: "availability",
        builtIn: false,
        slug: null,
      },
      {
        id: "level-has-slug",
        name: "Dub",
        kind: "availability",
        builtIn: true,
        slug: "dub",
      },
    ],
  });

  await backfillLanguageUsageLevelSlugs();

  const noSlugRow = levelRows.find(r => r.id === "level-no-slug");
  assert.equal(noSlugRow?.slug, "fan-subtitles");
  const hasSlugRow = levelRows.find(r => r.id === "level-has-slug");
  assert.equal(hasSlugRow?.slug, "dub");
});

test("ensureBuiltInLanguageUsageLevels: idempotent — seeds the 8 built-ins once, skips them on a repeat call", async () => {
  resetRows();

  await ensureBuiltInLanguageUsageLevels();
  assert.equal(levelRows.length, 8);
  const namesAfterFirst = levelRows.map(row => row.name).sort();

  await ensureBuiltInLanguageUsageLevels();
  assert.equal(levelRows.length, 8);
  assert.deepEqual(levelRows.map(row => row.name).sort(), namesAfterFirst);
});
