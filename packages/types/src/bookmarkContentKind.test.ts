import assert from "node:assert/strict";
import { test } from "node:test";

import { contentKindToMediaTypeName, detectContentKind } from "./bookmarkContentKind.js";

test("detectContentKind prioritizes YouTube over everything", () => {
  assert.equal(
    detectContentKind({
      isYouTube: true,
      isbn: "9780131103627",
      hasSocialAccount: true,
    }),
    "youtube-video",
  );
});

test("detectContentKind returns book for an ISBN", () => {
  assert.equal(detectContentKind({
    isYouTube: false,
    isbn: "9780131103627",
    hasSocialAccount: false,
  }), "book");
});

test("detectContentKind returns social-account for a social URL", () => {
  assert.equal(detectContentKind({
    isYouTube: false,
    isbn: null,
    hasSocialAccount: true,
  }), "social-account");
});

test("detectContentKind returns null for a generic page (no badge)", () => {
  assert.equal(detectContentKind({
    isYouTube: false,
    isbn: null,
    hasSocialAccount: false,
  }), null);
});

test("contentKindToMediaTypeName maps to the built-in media-type names", () => {
  assert.equal(contentKindToMediaTypeName("youtube-video"), "Video");
  assert.equal(contentKindToMediaTypeName("book"), "Book");
  assert.equal(contentKindToMediaTypeName("social-account"), "Social Media Post");
  assert.equal(contentKindToMediaTypeName("web-link"), null);
});
