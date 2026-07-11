import assert from "node:assert/strict";
import { mock, test } from "node:test";
import * as schema from "@/db/schema";
import { createFakeDb } from "./testUtils/fakeDb";

/**
 * Covers `applyAiSummaries` — the paste-JSON-to-apply flow. `updateBookmark`/`createTag` pull in a
 * deep dependency chain (see `bookmarksCacheInvalidation.test.ts`), so they're mocked here and this
 * file exercises `applyAiSummaries`'s own logic: description-patch shape, tag match-or-create + union,
 * the per-bookmark "Summarized by AI" upsert, `notFound` collection, and the single cache invalidation.
 * The fake db is fixture-per-table (it ignores `where`), so a single-bookmark shape is asserted.
 */

const fakeDb = createFakeDb();
let invalidateCalls = 0;
const updateCalls: { id: string;
  input: unknown; }[] = [];
const createdTagNames: string[] = [];

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
    createTag: (input: { name: string }) => {
      createdTagNames.push(input.name);
      return Promise.resolve({
        id: `created-${createdTagNames.length}`,
        name: input.name,
      });
    },
  },
});

const {
  applyAiSummaries,
} = await import("@/services/aiSummarization");

function reset(): void {
  fakeDb.reset();
  invalidateCalls = 0;
  updateCalls.length = 0;
  createdTagNames.length = 0;
  fakeDb.setRows(schema.customProperties, [{
    id: "content-status-prop",
  }]);
}

test("writes description, marks summarized, and skips unknown ids", async () => {
  reset();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);

  const result = await applyAiSummaries({
    items: [
      {
        id: "bm-1",
        summary: "A concise summary.",
      },
      {
        id: "missing",
        summary: "Never applied.",
      },
    ],
  });

  assert.equal(result.updated, 1);
  assert.deepEqual(result.notFound, ["missing"]);
  assert.equal(result.tagsCreated, 0);

  // Only the existing bookmark got an update, with just the description patch (no tagIds).
  assert.equal(updateCalls.length, 1);
  assert.equal(updateCalls[0]?.id, "bm-1");
  assert.deepEqual(updateCalls[0]?.input, {
    description: "A concise summary.",
  });

  // Content Status upserted to "summarized-by-ai" for the applied bookmark.
  const statusInsert = fakeDb.inserted.find(entry => entry.table === schema.bookmarkChoicesValues);
  assert.ok(statusInsert, "expected a content-status upsert");
  assert.deepEqual(statusInsert?.rows, {
    bookmarkId: "bm-1",
    propertyId: "content-status-prop",
    values: ["summarized-by-ai"],
  });

  assert.equal(invalidateCalls, 1);
});

test("matches an existing tag and creates a missing one, unioning onto current tags", async () => {
  reset();
  fakeDb.setRows(schema.bookmarks, [{
    id: "bm-1",
  }]);
  fakeDb.setRows(schema.tags, [{
    id: "tag-reading",
    name: "Reading",
  }]);
  fakeDb.setRows(schema.bookmarkTags, [{
    tagId: "tag-existing",
  }]);

  const result = await applyAiSummaries({
    items: [
      {
        id: "bm-1",
        summary: "Summary.",
        tags: ["reading", "AI"],
      },
    ],
  });

  assert.equal(result.updated, 1);
  assert.equal(result.tagsCreated, 1);
  assert.deepEqual(createdTagNames, ["AI"]);

  // "reading" matched "Reading" case-insensitively; "AI" was created; both unioned with the existing tag.
  const patch = updateCalls[0]?.input as { description: string;
    tagIds: string[]; };
  assert.equal(patch.description, "Summary.");
  assert.deepEqual([...patch.tagIds].sort(), ["created-1", "tag-existing", "tag-reading"]);
});

test("no-ops on an empty batch", async () => {
  reset();
  const result = await applyAiSummaries({
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
