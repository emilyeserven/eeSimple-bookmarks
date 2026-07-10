import assert from "node:assert/strict";
import { mock, test } from "node:test";
import {
  bookmarks,
  categories,
  entityNames,
  taxonomyAssignments,
} from "@/db/schema";
import { createFakeDb, resetFakeIds } from "@/tests/testDbHelpers";

/**
 * `services/categories.ts` is exercised against the shared in-memory fake `db`
 * (`testDbHelpers.ts`) — this suite has no live-Postgres harness. `mock.module` swaps `@/db` before
 * the service module is first imported (ESM import caching), so the mock must be installed up front.
 *
 * `ensureDefaultCategory` memoizes the built-in Default category's id in a module-level variable for
 * the lifetime of the process, so every test's fixture seeds the *same* Default row id
 * (`DEFAULT_CATEGORY_ID`) — otherwise the memo from an earlier test would point at a row that no
 * longer exists in a later test's freshly reset fixture.
 */

const DEFAULT_CATEGORY_ID = "default-category-id";

// Mutable, never-reassigned fixture arrays — the fake `db` closes over these by reference.
const categoryRows: Record<string, unknown>[] = [];
const bookmarkRows: Record<string, unknown>[] = [];
const taxonomyAssignmentRows: Record<string, unknown>[] = [];
const entityNameRows: Record<string, unknown>[] = [];

// Per-test override for the app-configured default category, read by the mocked
// `getAutomationSettings` below — `resolveDefaultCategoryId()` falls back to `ensureDefaultCategory()`
// when this is null, mirroring the real service's behavior without seeding the app_settings table.
let automationDefaultCategoryId: string | null = null;

function resetRows(opts: {
  categories?: Record<string, unknown>[];
  bookmarks?: Record<string, unknown>[];
  taxonomyAssignments?: Record<string, unknown>[];
  entityNames?: Record<string, unknown>[];
}): void {
  resetFakeIds();
  automationDefaultCategoryId = null;
  const defaultRow = {
    id: DEFAULT_CATEGORY_ID,
    name: "Default",
    slug: "default",
    description: null,
    icon: null,
    builtIn: true,
    isHomepage: true,
    createdAt: new Date(),
  };
  categoryRows.length = 0;
  categoryRows.push(defaultRow, ...(opts.categories ?? []));
  bookmarkRows.length = 0;
  bookmarkRows.push(...(opts.bookmarks ?? []));
  taxonomyAssignmentRows.length = 0;
  taxonomyAssignmentRows.push(...(opts.taxonomyAssignments ?? []));
  entityNameRows.length = 0;
  entityNameRows.push(...(opts.entityNames ?? []));
}

const db = createFakeDb([
  {
    table: categories,
    rows: categoryRows,
  },
  {
    table: bookmarks,
    rows: bookmarkRows,
  },
  {
    table: taxonomyAssignments,
    rows: taxonomyAssignmentRows,
  },
  {
    table: entityNames,
    rows: entityNameRows,
  },
]);

mock.module("@/db", {
  namedExports: {
    db,
  },
});

// `services/categories.ts` only calls `getAutomationSettings` from this module, but
// `services/entityNames.ts` (imported transitively) calls other exports of it — re-export the real
// module's exports and only override `getAutomationSettings`, rather than replacing the module
// wholesale (which `namedExports` does by default).
const realAppSettings = await import("@/services/appSettings");
mock.module("@/services/appSettings", {
  namedExports: {
    ...realAppSettings,
    getAutomationSettings: async () => ({
      autoFetchTitle: true,
      autoFetchImage: true,
      autoApplyTitleTags: false,
      autoApplyTitleLocations: false,
      shareBypassInbox: false,
      sidebarOpenModifier: "alt",
      defaultCategoryId: automationDefaultCategoryId,
    }),
  },
});

const {
  BuiltInCategoryError,
  createCategory,
  deleteCategory,
  ensureDefaultCategory,
  resolveDefaultCategoryId,
} = await import("@/services/categories");
const {
  bookmarkCacheVersion,
} = await import("@/services/bookmarkCacheVersion");

test.beforeEach(() => {
  resetRows({});
});

// `ensureDefaultCategory` memoizes the default category's id in a module-level variable on its
// first successful call, after which every later call short-circuits and skips its slug-backfill +
// bookmark-reassignment body entirely. So this must run first, before any other test's `deleteCategory`
// call (which also invokes `ensureDefaultCategory` internally) consumes that one real run.
test("ensureDefaultCategory: backfills missing slugs and leaves already-slugged categories untouched", async () => {
  resetRows({
    categories: [
      {
        id: "cat-no-slug",
        name: "Manga & Comics",
        slug: null,
        description: null,
        icon: null,
        builtIn: false,
        isHomepage: false,
        createdAt: new Date(),
      },
      {
        id: "cat-has-slug",
        name: "Anime",
        slug: "anime",
        description: null,
        icon: null,
        builtIn: false,
        isHomepage: false,
        createdAt: new Date(),
      },
    ],
  });

  const id = await ensureDefaultCategory();
  assert.equal(id, DEFAULT_CATEGORY_ID);

  const noSlugRow = categoryRows.find(r => r.id === "cat-no-slug");
  assert.equal(noSlugRow?.slug, "manga-comics");
  const hasSlugRow = categoryRows.find(r => r.id === "cat-has-slug");
  assert.equal(hasSlugRow?.slug, "anime");
});

test("deleteCategory: the built-in Default category cannot be deleted", async () => {
  await assert.rejects(() => deleteCategory(DEFAULT_CATEGORY_ID), BuiltInCategoryError);
});

test("deleteCategory: a missing id returns false with no side effects", async () => {
  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteCategory("nonexistent-id");
  assert.equal(deleted, false);
  assert.equal(bookmarkCacheVersion(), versionBefore);
});

test("deleteCategory: cleans up genre/mood + entity-name rows, reassigns orphaned bookmarks to Default, and invalidates the cache", async () => {
  resetRows({
    categories: [{
      id: "cat-1",
      name: "Anime",
      slug: "anime",
      description: null,
      icon: null,
      builtIn: false,
      isHomepage: false,
      createdAt: new Date(),
    }],
    bookmarks: [
      {
        id: "bm-1",
        categoryId: null,
      },
      {
        id: "bm-2",
        categoryId: "cat-1",
      },
    ],
    taxonomyAssignments: [
      {
        id: "gma-1",
        ownerType: "category",
        ownerId: "cat-1",
        genreMoodId: "gm-1",
      },
      {
        id: "gma-2",
        ownerType: "bookmark",
        ownerId: "bm-1",
        genreMoodId: "gm-1",
      },
    ],
    entityNames: [
      {
        id: "en-1",
        ownerType: "category",
        ownerId: "cat-1",
        name: "Anime",
      },
    ],
  });

  const versionBefore = bookmarkCacheVersion();
  const deleted = await deleteCategory("cat-1");
  assert.equal(deleted, true);

  // The category row itself is gone.
  assert.equal(categoryRows.some(row => row.id === "cat-1"), false);

  // Only the category-owned genre/mood assignment was cleaned up; the bookmark-owned one survives.
  assert.deepEqual(taxonomyAssignmentRows.map(row => row.id), ["gma-2"]);

  // The category's entity-name row was cleaned up.
  assert.equal(entityNameRows.length, 0);

  // Bookmarks left with a null categoryId (the deleted category's cascade-nulled member, and any
  // other orphan) are reassigned to Default — a broad `isNull` update, not scoped to `cat-1` alone.
  const bm1 = bookmarkRows.find(row => row.id === "bm-1");
  assert.equal(bm1?.categoryId, DEFAULT_CATEGORY_ID);
  // A bookmark still pointing at a different, undeleted category is left untouched.
  const bm2 = bookmarkRows.find(row => row.id === "bm-2");
  assert.equal(bm2?.categoryId, "cat-1");

  assert.equal(bookmarkCacheVersion(), versionBefore + 1);
});

test("resolveDefaultCategoryId: falls back to the seeded built-in when unset", async () => {
  automationDefaultCategoryId = null;
  const id = await resolveDefaultCategoryId();
  assert.equal(id, DEFAULT_CATEGORY_ID);
});

test("resolveDefaultCategoryId: returns the app-configured category when set", async () => {
  resetRows({
    categories: [{
      id: "cat-custom-default",
      name: "Inbox",
      slug: "inbox",
      description: null,
      icon: null,
      builtIn: false,
      isHomepage: false,
      createdAt: new Date(),
    }],
  });
  automationDefaultCategoryId = "cat-custom-default";

  const id = await resolveDefaultCategoryId();
  assert.equal(id, "cat-custom-default");
});

test("deleteCategory: orphaned bookmarks are reassigned to the app-configured default, not always the built-in", async () => {
  resetRows({
    categories: [
      {
        id: "cat-custom-default",
        name: "Inbox",
        slug: "inbox",
        description: null,
        icon: null,
        builtIn: false,
        isHomepage: false,
        createdAt: new Date(),
      },
      {
        id: "cat-1",
        name: "Anime",
        slug: "anime",
        description: null,
        icon: null,
        builtIn: false,
        isHomepage: false,
        createdAt: new Date(),
      },
    ],
    bookmarks: [
      // Cascade-nulled by the delete, same fixture shape as the other deleteCategory test above
      // (this fake db doesn't simulate FK cascade, so the orphan is seeded pre-nulled).
      {
        id: "bm-1",
        categoryId: null,
      },
    ],
  });
  automationDefaultCategoryId = "cat-custom-default";

  const deleted = await deleteCategory("cat-1");
  assert.equal(deleted, true);

  const bm1 = bookmarkRows.find(row => row.id === "bm-1");
  assert.equal(bm1?.categoryId, "cat-custom-default");
});

test("createCategory: a name colliding with an existing slug gets a disambiguated slug", async () => {
  resetRows({
    categories: [{
      id: "cat-existing",
      name: "Anime",
      slug: "anime",
      description: null,
      icon: null,
      builtIn: false,
      isHomepage: false,
      createdAt: new Date(),
    }],
  });

  const created = await createCategory({
    name: "Anime",
  });

  assert.equal(created.slug, "anime-2");
});
