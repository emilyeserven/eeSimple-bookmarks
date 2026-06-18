import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookmarkIdFromKey,
  contentTypeForKey,
  partitionDeletableKeys,
  resolveBookmarkId,
} from "@/services/gallery";

// Pure-function coverage for the gallery catalog/orphan logic — no DB or object store.

test("bookmarkIdFromKey extracts the uuid from a managed image key", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(bookmarkIdFromKey(`bookmarks/${id}.webp`), id);
  assert.equal(bookmarkIdFromKey(`bookmarks/${id}.png`), id);
});

test("bookmarkIdFromKey returns null for keys that don't fit the scheme", () => {
  assert.equal(bookmarkIdFromKey("bookmarks/not-a-uuid.webp"), null);
  assert.equal(bookmarkIdFromKey("bookmarks/nested/550e8400-e29b-41d4-a716-446655440000.webp"), null);
  assert.equal(bookmarkIdFromKey("other/550e8400-e29b-41d4-a716-446655440000.webp"), null);
});

test("contentTypeForKey maps known extensions and falls back to null", () => {
  assert.equal(contentTypeForKey("bookmarks/x.webp"), "image/webp");
  assert.equal(contentTypeForKey("bookmarks/x.PNG"), "image/png");
  assert.equal(contentTypeForKey("bookmarks/x.jpeg"), "image/jpeg");
  assert.equal(contentTypeForKey("bookmarks/x.bin"), null);
});

test("resolveBookmarkId links only when the encoded bookmark still exists", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(resolveBookmarkId(`bookmarks/${id}.webp`, new Set([id])), id);
  // Encoded bookmark no longer exists → orphan.
  assert.equal(resolveBookmarkId(`bookmarks/${id}.webp`, new Set()), null);
  // Key doesn't encode a uuid → never linkable.
  assert.equal(resolveBookmarkId("bookmarks/stray.webp", new Set([id])), null);
});

test("partitionDeletableKeys deletes only unknown-to-live orphan keys, refusing the rest", () => {
  const rows = [
    {
      objectKey: "bookmarks/orphan.webp",
      bookmarkId: null,
    },
    {
      objectKey: "bookmarks/live.webp",
      bookmarkId: "550e8400-e29b-41d4-a716-446655440000",
    },
  ];
  const {
    deletable, skipped,
  } = partitionDeletableKeys(
    ["bookmarks/orphan.webp", "bookmarks/live.webp", "bookmarks/missing.webp"],
    rows,
  );
  // Orphan is deletable; a live-linked key is refused; an unknown key is refused.
  assert.deepEqual(deletable, ["bookmarks/orphan.webp"]);
  assert.deepEqual(skipped, ["bookmarks/live.webp", "bookmarks/missing.webp"]);
});
