import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

/**
 * Covers `applyAiTags` — the paste-JSON-to-apply flow. `updateBookmark`/`resolveTagIdsByName` pull in a
 * deep dependency chain, so they're mocked here and this file exercises `applyAiTags`'s own logic: the
 * tag union onto current tags, `notFound` collection, the empty-tags skip, and the single cache
 * invalidation. The fake db is fixture-per-table (it ignores `where`), so a single-bookmark shape is
 * asserted. Mirrors `aiSummarization.test.ts`.
 */

const fakeDb = createFakeDb();
let invalidateCalls = 0;
const updateCalls: { id: string;
  input: unknown; }[] = [];
const createdTagNames: string[] = [];
/** Existing tags the mocked `resolveTagIdsByName` matches against (case-insensitive). */
const existingTags: { id: string;
  name: string; }[] = [];

mock.module("@/db", {
  namedExports: {
    db: fakeDb.db,
  },
});
mock.module("@/services/bookmarkCache", {
  namedExports: {
    invalidateBookmarkCache: () => {
      invalidateCalls++;
    },
  },
});
mock.module("@/services/bookmarks", {
  namedExports: {
    updateBookmark: (id: string, input: unknown) => {
      updateCalls.push({
        id,
        input,
      });
      return Promise.resolve({
        id,
      });
    },
  },
});
mock.module("@/services/tags", {
  namedExports: {
    // Mirror the real `resolveTagIdsByName`: match names against `existingTags` case-insensitively,
    // create the rest (tracked in `createdTagNames`).
    resolveTagIdsByName: (names: string[], created: { count: number }): Promise<string[]> => {
      const cleaned = [...new Set(names.map(name => name.trim()).filter(Boolean))];
      const idByLowerName = new Map(existingTags.map(tag => [tag.name.toLowerCase(), tag.id]));
      const ids: string[] = [];
      for (const name of cleaned) {
        const hit = idByLowerName.get(name.toLowerCase());
        if (hit) {
          ids.push(hit);
          continue;
        }
        createdTagNames.push(name);
        const id = `created-${createdTagNames.length}`;
        idByLowerName.set(name.toLowerCase(), id);
        created.count += 1;
        ids.push(id);
      }
      return Promise.resolve(ids);
    },
  },
});

const {
  applyAiTags,
} = await import("@/services/aiAutotag");

function reset(): void {
  fakeDb.reset();
  invalidateCalls = 0;
  updateCalls.length = 0;
  createdTagNames.length = 0;
  existingTags.length = 0;
}

test("matches an existing tag, creates a missing one, unions onto current tags, skips unknown ids", async () => {
  reset();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);
  existingTags.push({
    id: "tag-reading",
    name: "Reading",
  });
  fakeDb.setRows(schema.bookmarkTags, [{
    tagId: "tag-existing",
  }]);

  const result = await applyAiTags({
    items: [
      {
        id: "bm-1",
        tags: ["reading", "AI"],
      },
      {
        id: "missing",
        tags: ["ignored"],
      },
    ],
  });

  assert.equal(result.updated, 1);
  assert.deepEqual(result.notFound, ["missing"]);
  assert.equal(result.tagsCreated, 1);
  assert.deepEqual(createdTagNames, ["AI"]);

  // Only the existing bookmark got an update, with just the unioned tagIds (no description).
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0]?.id, "bm-1");
  const patch = updateCalls[0]?.input as { tagIds: string[] };
  assert.deepEqual([...patch.tagIds].sort(), ["created-1", "tag-existing", "tag-reading"]);

  assert.equal(invalidateCalls, 1);
});

test("skips an item whose tag list is empty", async () => {
  reset();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);

  const result = await applyAiTags({
    items: [
      {
        id: "bm-1",
        tags: [],
      },
    ],
  });

  assert.equal(result.updated, 0);
  assert.equal(updateCalls.length, 0);
  assert.equal(invalidateCalls, 0);
});

test("no-ops on an empty batch", async () => {
  reset();
  const result = await applyAiTags({
    items: [],
  });
  assert.deepEqual(result, {
    updated: 0,
    notFound: [],
    tagsCreated: 0,
  });
  assert.equal(updateCalls.length, 0);
  assert.equal(invalidateCalls, 0);
});
