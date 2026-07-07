import type { BookmarkHierarchyNode } from "../lib/bookmarkHierarchy";
import type { RelatedBookmarkEntry } from "../lib/relatedBookmarks";
import type { FlatNode } from "../lib/tagTree";
import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBookmarkDetailSections } from "./bookmarkDetailSections";
import { makeBookmark } from "../test-utils/factories";

function build(
  bookmark: Bookmark,
  flatHierarchy: FlatNode<BookmarkHierarchyNode>[] = [],
  relatedBookmarks: RelatedBookmarkEntry[] = [],
) {
  return buildBookmarkDetailSections({
    bookmark,
    categories: [],
    properties: [],
    propertyGroups: [],
    flatHierarchy,
    relatedBookmarks,
    mediaSourceMatches: [],
  }).map(s => s.id);
}

describe("buildBookmarkDetailSections", () => {
  it("always includes General, Metadata, and Debug, omitting empty optional sections", () => {
    expect(build(makeBookmark())).toEqual(["general", "metadata", "debug"]);
  });

  it("includes tags inside the General section (no separate Tags section)", () => {
    const bookmark = makeBookmark({
      tags: [{
        id: "t1",
        name: "Dev",
        slug: "dev",
        parentId: null,
      }],
    });
    expect(build(bookmark)).toEqual(["general", "metadata", "debug"]);
  });

  it("adds the Gallery section when the bookmark has images, omitting it otherwise", () => {
    const withImages = makeBookmark({
      images: [
        {
          id: "img1",
          url: "https://example.com/1.png",
          width: 100,
          height: 100,
          source: "upload",
          isMain: true,
          sortOrder: 0,
        },
      ],
    });
    expect(build(withImages)).toContain("gallery");
    expect(build(makeBookmark())).not.toContain("gallery");
  });

  it("adds the Gallery section when the bookmark only has a screenshot", () => {
    const withScreenshot = makeBookmark({
      screenshot: {
        id: "b1",
        url: "https://example.com/screenshot.png",
        width: 100,
        height: 100,
        source: "screenshot",
        isMain: false,
        sortOrder: 0,
      },
    });
    expect(build(withScreenshot)).toContain("gallery");
  });

  it("adds the Video section when the bookmark has an archived reel, omitting it otherwise", () => {
    const withReel = makeBookmark({
      reelArchive: {
        url: "/api/bookmarks/b1/reel-archive",
        contentType: "video/mp4",
        byteSize: 1024,
        width: 720,
        height: 1280,
        durationSeconds: 12,
        sourceUrl: "https://www.instagram.com/reel/abc123/",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(build(withReel)).toContain("video");
    expect(build(makeBookmark())).not.toContain("video");
  });

  it("adds the Related section when related bookmarks are supplied, omitting it otherwise", () => {
    const related: RelatedBookmarkEntry[] = [{
      bookmark: makeBookmark({
        id: "rel-1",
      }),
      relationship: undefined,
    }];
    expect(build(makeBookmark(), [], related)).toContain("related");
    expect(build(makeBookmark())).not.toContain("related");
  });

  it("folds the parent/child hierarchy into the Related section", () => {
    const flat: FlatNode<BookmarkHierarchyNode>[] = [
      {
        node: {
          bookmark: makeBookmark({
            id: "x",
          }),
          isTarget: true,
          children: [],
        },
        depth: 0,
      },
    ];
    // Hierarchy is no longer a standalone section — it shows up under "related".
    expect(build(makeBookmark(), flat)).toContain("related");
    expect(build(makeBookmark(), flat)).not.toContain("hierarchy");
  });

  it("folds shared media-source matches into the Related section", () => {
    const sections = buildBookmarkDetailSections({
      bookmark: makeBookmark({
        isbn: "9780000000000",
      }),
      categories: [],
      properties: [],
      propertyGroups: [],
      flatHierarchy: [],
      relatedBookmarks: [],
      mediaSourceMatches: [{
        field: "isbn",
        value: "9780000000000",
        bookmarks: [makeBookmark({
          id: "other",
        })],
      }],
    }).map(s => s.id);
    expect(sections).toContain("related");
    expect(sections).not.toContain("media-source");
  });

  it("keeps a stable order when several optional sections are present", () => {
    const bookmark = makeBookmark({
      tags: [{
        id: "t1",
        name: "Dev",
        slug: "dev",
        parentId: null,
      }],
    });
    const related: RelatedBookmarkEntry[] = [{
      bookmark: makeBookmark({
        id: "o1",
      }),
      relationship: {
        relationshipTypeId: "r1",
        relationshipTypeName: "Related",
        directional: false,
        role: "parent",
        label: null,
        bookmark: {
          id: "o1",
          title: "Other",
          url: "https://o.com",
        },
      },
    }];
    expect(build(bookmark, [], related)).toEqual(["general", "related", "metadata", "debug"]);
  });
});
