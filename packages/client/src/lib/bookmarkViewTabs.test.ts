// @vitest-environment node
import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { hiddenBookmarkViewTabKeys } from "./bookmarkViewTabs";
import { makeBookmark } from "../test-utils/factories";

const NO_DATA = {
  relatedBookmarkCount: 0,
  hierarchyCount: 0,
  mediaSourceCount: 0,
  hasPropertyRows: false,
};

const IMAGE: Bookmark["images"][number] = {
  id: "img1",
  url: "https://example.com/1.png",
  width: 100,
  height: 100,
  source: "upload",
  isMain: true,
  sortOrder: 0,
};

const REEL: NonNullable<Bookmark["reelArchive"]> = {
  url: "/api/bookmarks/b1/reel-archive",
  contentType: "video/mp4",
  byteSize: 1024,
  width: 720,
  height: 1280,
  durationSeconds: 12,
  sourceUrl: "https://www.instagram.com/reel/abc123/",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const LANGUAGE_USAGE: Bookmark["languageUsages"][number] = {
  id: "lu1",
  language: {
    id: "l1",
    name: "English",
    isoCode: "en",
    slug: "english",
  },
  level: {
    id: "lv1",
    name: "Dub",
    slug: "dub",
    kind: "availability",
  },
  note: null,
  translationSource: null,
};

const LOCATION: Bookmark["locations"][number] = {
  id: "loc1",
  name: "Tokyo",
  slug: "tokyo",
  parentId: null,
  placeType: null,
  locationRelation: null,
};

describe("hiddenBookmarkViewTabKeys", () => {
  it("hides every optional tab for a bare bookmark with no data", () => {
    expect([...hiddenBookmarkViewTabKeys(makeBookmark(), NO_DATA)].sort()).toEqual([
      "image",
      "languages",
      "properties",
      "related",
      "video",
    ]);
  });

  it("keeps the Image tab when the bookmark has an image or only a screenshot", () => {
    expect(hiddenBookmarkViewTabKeys(makeBookmark({
      images: [IMAGE],
    }), NO_DATA)).not.toContain("image");
    expect(hiddenBookmarkViewTabKeys(makeBookmark({
      screenshot: {
        ...IMAGE,
        isMain: false,
        source: "screenshot",
      },
    }), NO_DATA)).not.toContain("image");
  });

  it("keeps the Video tab when the bookmark has an archived reel", () => {
    expect(hiddenBookmarkViewTabKeys(makeBookmark({
      reelArchive: REEL,
    }), NO_DATA)).not.toContain("video");
  });

  it("keeps the Languages tab when the bookmark has usages", () => {
    const withLanguage = makeBookmark({
      languageUsages: [LANGUAGE_USAGE],
    });
    expect(hiddenBookmarkViewTabKeys(withLanguage, NO_DATA)).not.toContain("languages");
  });

  it("keeps the Properties tab when property rows render", () => {
    expect(hiddenBookmarkViewTabKeys(makeBookmark(), {
      ...NO_DATA,
      hasPropertyRows: true,
    })).not.toContain("properties");
  });

  it("keeps the Related tab when any of related / hierarchy / media-source / locations is present", () => {
    expect(hiddenBookmarkViewTabKeys(makeBookmark(), {
      ...NO_DATA,
      relatedBookmarkCount: 1,
    })).not.toContain("related");
    expect(hiddenBookmarkViewTabKeys(makeBookmark(), {
      ...NO_DATA,
      hierarchyCount: 1,
    })).not.toContain("related");
    expect(hiddenBookmarkViewTabKeys(makeBookmark(), {
      ...NO_DATA,
      mediaSourceCount: 1,
    })).not.toContain("related");
    expect(hiddenBookmarkViewTabKeys(makeBookmark({
      locations: [LOCATION],
    }), NO_DATA)).not.toContain("related");
  });
});
