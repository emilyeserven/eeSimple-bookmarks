// @vitest-environment node
import { describe, expect, it } from "vitest";

import { makeBookmark, makeBookmarkImage, makeTag } from "../../test-utils/factories";
import { normalizeBookmark } from "./bookmarks";

describe("normalizeBookmark", () => {
  it("coerces array fields a stale/version-skewed payload omits to []", () => {
    // Simulate an API that predates newer array fields (e.g. `languageUsages` before #914).
    const {
      languageUsages, tags, people, relationships, ...rest
    } = makeBookmark();
    void languageUsages;
    void tags;
    void people;
    void relationships;

    const normalized = normalizeBookmark(rest);

    expect(normalized.languageUsages).toEqual([]);
    expect(normalized.tags).toEqual([]);
    expect(normalized.people).toEqual([]);
    expect(normalized.relationships).toEqual([]);
  });

  it("passes present arrays through untouched", () => {
    const tags = [makeTag({
      id: "t1",
    })];
    const images = [makeBookmarkImage({
      id: "i1",
    })];
    const bookmark = makeBookmark({
      tags,
      images,
    });

    const normalized = normalizeBookmark(bookmark);

    expect(normalized.tags).toEqual(tags);
    expect(normalized.images).toEqual(images);
  });
});
