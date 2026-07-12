import assert from "node:assert/strict";
import { test } from "node:test";

import type { UpdateBookmarkInput } from "@eesimple/types";

import { scalarBookmarkPatch } from "@/services/bookmarks";

test("scalarBookmarkPatch is empty for an update that touches no scalar fields", () => {
  assert.deepEqual(scalarBookmarkPatch({}, undefined), {});
});

test("scalarBookmarkPatch copies only the provided scalar fields", () => {
  const input: UpdateBookmarkInput = {
    title: "New title",
    priority: 3,
  };
  assert.deepEqual(scalarBookmarkPatch(input, undefined), {
    title: "New title",
    priority: 3,
  });
});

test("scalarBookmarkPatch coalesces nullable fields to null", () => {
  const input = {
    originalUrl: null,
    description: null,
  } as UpdateBookmarkInput;
  assert.deepEqual(scalarBookmarkPatch(input, undefined), {
    originalUrl: null,
    description: null,
  });
});

test("scalarBookmarkPatch copies secondaryUrl as a plain scalar (no website derivation)", () => {
  // The secondary "Download URL" is inert — it rides through the scalar patch and, unlike `url`,
  // never triggers website/channel/duplicate derivation (that stays in the `url` branch of updateBookmark).
  assert.deepEqual(scalarBookmarkPatch({
    secondaryUrl: "https://example.com/download.pdf",
  } as UpdateBookmarkInput, undefined), {
    secondaryUrl: "https://example.com/download.pdf",
  });
  // An explicit null clears it.
  assert.deepEqual(scalarBookmarkPatch({
    secondaryUrl: null,
  } as UpdateBookmarkInput, undefined), {
    secondaryUrl: null,
  });
});

test("scalarBookmarkPatch copies the Kavita link fields, coalescing null to unlink", () => {
  const input: UpdateBookmarkInput = {
    kavitaSeriesId: 12,
    kavitaLibraryId: 3,
    kavitaSeriesName: "Berserk",
  };
  assert.deepEqual(scalarBookmarkPatch(input, undefined), {
    kavitaSeriesId: 12,
    kavitaLibraryId: 3,
    kavitaSeriesName: "Berserk",
  });
  // Explicit nulls unlink; omitting the fields leaves them untouched (first test covers that).
  assert.deepEqual(scalarBookmarkPatch({
    kavitaSeriesId: null,
    kavitaLibraryId: null,
    kavitaSeriesName: null,
  } as UpdateBookmarkInput, undefined), {
    kavitaSeriesId: null,
    kavitaLibraryId: null,
    kavitaSeriesName: null,
  });
});

test("scalarBookmarkPatch copies passthrough fields (categoryId, priority) verbatim", () => {
  assert.deepEqual(scalarBookmarkPatch({
    categoryId: "cat-1",
    priority: 5,
  }, undefined), {
    categoryId: "cat-1",
    priority: 5,
  });
});

test("scalarBookmarkPatch coalesces the Plex link fields, mixing set and cleared values", () => {
  assert.deepEqual(scalarBookmarkPatch({
    plexRatingKey: "rk-9",
    plexItemType: null,
    plexItemTitle: "Dune",
  } as UpdateBookmarkInput, undefined), {
    plexRatingKey: "rk-9",
    plexItemType: null,
    plexItemTitle: "Dune",
  });
});

test("scalarBookmarkPatch copies an explicit youtubeChannelId, coalescing null to unlink", () => {
  assert.deepEqual(scalarBookmarkPatch({
    youtubeChannelId: "chan-1",
  } as UpdateBookmarkInput, undefined), {
    youtubeChannelId: "chan-1",
  });
  assert.deepEqual(scalarBookmarkPatch({
    youtubeChannelId: null,
  } as UpdateBookmarkInput, undefined), {
    youtubeChannelId: null,
  });
});

test("scalarBookmarkPatch applies the media-type default only when the caller set none", () => {
  assert.deepEqual(scalarBookmarkPatch({}, "mt-video"), {
    mediaTypeId: "mt-video",
  });
  // An explicit media type wins over the default.
  assert.deepEqual(scalarBookmarkPatch({
    mediaTypeId: "mt-chosen",
  }, "mt-video"), {
    mediaTypeId: "mt-chosen",
  });
  // An explicit null clears it, still ignoring the default.
  assert.deepEqual(scalarBookmarkPatch({
    mediaTypeId: null,
  } as UpdateBookmarkInput, "mt-video"), {
    mediaTypeId: null,
  });
});
