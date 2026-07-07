// @vitest-environment node
import type { Bookmark, BookmarkRelationship, RelationshipRole } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildRelationshipTypeCards } from "./relationshipTypeCards";

import { makeBookmark } from "../test-utils/factories";

/** Build a relationship edge pointing at `other` (as seen from the carrying bookmark). */
function rel(
  other: Bookmark,
  opts: { typeId: string;
    directional: boolean;
    role: RelationshipRole;
    label?: string | null; },
): BookmarkRelationship {
  return {
    bookmark: {
      id: other.id,
      url: other.url,
      title: other.title,
    },
    relationshipTypeId: opts.typeId,
    relationshipTypeName: opts.typeId,
    directional: opts.directional,
    role: opts.role,
    label: opts.label ?? null,
  };
}

const TYPE = "type-1";

describe("buildRelationshipTypeCards — directional", () => {
  const parent = makeBookmark({
    id: "p",
    title: "Parent",
  });
  const childA = makeBookmark({
    id: "ca",
    title: "Child A",
  });
  const childB = makeBookmark({
    id: "cb",
    title: "Child B",
  });

  // The same edges are carried on BOTH endpoints (as hydration emits them), so dedup is exercised.
  parent.relationships = [
    rel(childA, {
      typeId: TYPE,
      directional: true,
      role: "child",
      label: "first",
    }),
    rel(childB, {
      typeId: TYPE,
      directional: true,
      role: "child",
    }),
  ];
  childA.relationships = [rel(parent, {
    typeId: TYPE,
    directional: true,
    role: "parent",
    label: "first",
  })];
  childB.relationships = [rel(parent, {
    typeId: TYPE,
    directional: true,
    role: "parent",
  })];

  it("groups children under their parent, deduped and title-sorted", () => {
    const groups = buildRelationshipTypeCards(TYPE, true, [childB, parent, childA]);
    expect(groups).toHaveLength(1);
    expect(groups[0].anchor.id).toBe("p");
    expect(groups[0].members.map(m => m.bookmark.id)).toEqual(["ca", "cb"]);
    expect(groups[0].members[0].label).toBe("first");
  });

  it("ignores edges of other relationship types", () => {
    expect(buildRelationshipTypeCards("other-type", true, [parent, childA, childB])).toEqual([]);
  });

  it("ignores symmetric edges when the type is directional", () => {
    const x = makeBookmark({
      id: "x",
      title: "X",
    });
    const y = makeBookmark({
      id: "y",
      title: "Y",
    });
    x.relationships = [rel(y, {
      typeId: TYPE,
      directional: false,
      role: "related",
    })];
    expect(buildRelationshipTypeCards(TYPE, true, [x, y])).toEqual([]);
  });
});

describe("buildRelationshipTypeCards — symmetric", () => {
  it("emits one anchor card per bookmark in a related pair", () => {
    const a = makeBookmark({
      id: "a",
      title: "Alpha",
    });
    const b = makeBookmark({
      id: "b",
      title: "Beta",
    });
    a.relationships = [rel(b, {
      typeId: TYPE,
      directional: false,
      role: "related",
      label: "twins",
    })];
    b.relationships = [rel(a, {
      typeId: TYPE,
      directional: false,
      role: "related",
      label: "twins",
    })];

    const groups = buildRelationshipTypeCards(TYPE, false, [b, a]);
    expect(groups.map(g => g.anchor.id)).toEqual(["a", "b"]);
    expect(groups[0].members.map(m => m.bookmark.id)).toEqual(["b"]);
    expect(groups[1].members.map(m => m.bookmark.id)).toEqual(["a"]);
    expect(groups[0].members[0].label).toBe("twins");
  });

  it("returns no cards when nothing links under the type", () => {
    const lonely = makeBookmark({
      id: "l",
      title: "Lonely",
    });
    expect(buildRelationshipTypeCards(TYPE, false, [lonely])).toEqual([]);
  });
});
