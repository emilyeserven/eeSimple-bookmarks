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
