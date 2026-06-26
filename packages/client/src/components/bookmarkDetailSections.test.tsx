import type { BookmarkHierarchyNode } from "../lib/bookmarkHierarchy";
import type { FlatNode } from "../lib/tagTree";
import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBookmarkDetailSections } from "./bookmarkDetailSections";
import { makeBookmark } from "../test-utils/factories";

function build(bookmark: Bookmark, flatHierarchy: FlatNode<BookmarkHierarchyNode>[] = []) {
  return buildBookmarkDetailSections({
    bookmark,
    categories: [],
    properties: [],
    propertyGroups: [],
    flatHierarchy,
  }).map(s => s.id);
}

describe("buildBookmarkDetailSections", () => {
  it("always includes General and Metadata, omitting empty optional sections", () => {
    expect(build(makeBookmark())).toEqual(["general", "metadata"]);
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
    expect(build(bookmark)).toEqual(["general", "metadata"]);
  });

  it("adds the Hierarchy section when a flat hierarchy is supplied", () => {
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
    expect(build(makeBookmark(), flat)).toContain("hierarchy");
  });

  it("keeps a stable order when several optional sections are present", () => {
    const bookmark = makeBookmark({
      tags: [{
        id: "t1",
        name: "Dev",
        slug: "dev",
        parentId: null,
      }],
      relationships: [
        {
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
      ],
    });
    expect(build(bookmark)).toEqual(["general", "relationships", "metadata"]);
  });
});
