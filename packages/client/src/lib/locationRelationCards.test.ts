// @vitest-environment node
import type { Bookmark, BookmarkLocation } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildLocationRelationCards } from "./locationRelationCards";

import { makeBookmark } from "../test-utils/factories";

const RELATION = "relation-1";

/** Build a bookmark-location edge, optionally carrying a location relation. */
function loc(
  id: string,
  name: string,
  relationId: string | null,
): BookmarkLocation {
  return {
    id,
    name,
    slug: id,
    parentId: null,
    placeType: null,
    locationRelation: relationId
      ? {
        id: relationId,
        name: relationId,
        slug: relationId,
      }
      : null,
  };
}

describe("buildLocationRelationCards", () => {
  it("groups a bookmark's matching location edges, title- and name-sorted", () => {
    const beta = makeBookmark({
      id: "b",
      title: "Beta",
      locations: [loc("kyoto", "Kyoto", RELATION), loc("aichi", "Aichi", RELATION)],
    });
    const alpha = makeBookmark({
      id: "a",
      title: "Alpha",
      locations: [loc("tokyo", "Tokyo", RELATION)],
    });

    const groups = buildLocationRelationCards(RELATION, [beta, alpha]);

    expect(groups.map(g => g.bookmark.id)).toEqual(["a", "b"]);
    expect(groups[1].locations.map(l => l.name)).toEqual(["Aichi", "Kyoto"]);
  });

  it("keeps only location edges matching the relation id", () => {
    const bookmark = makeBookmark({
      id: "b",
      title: "Mixed",
      locations: [loc("tokyo", "Tokyo", RELATION), loc("kyoto", "Kyoto", "other-relation")],
    });

    const groups = buildLocationRelationCards(RELATION, [bookmark]);

    expect(groups).toHaveLength(1);
    expect(groups[0].locations.map(l => l.id)).toEqual(["tokyo"]);
  });

  it("drops bookmarks with no matching location edge", () => {
    const noRelation = makeBookmark({
      id: "n",
      title: "No relation",
      locations: [loc("tokyo", "Tokyo", null)],
    });
    const otherRelation = makeBookmark({
      id: "o",
      title: "Other",
      locations: [loc("kyoto", "Kyoto", "other-relation")],
    });
    const noLocations: Bookmark = makeBookmark({
      id: "e",
      title: "Empty",
    });

    expect(buildLocationRelationCards(RELATION, [noRelation, otherRelation, noLocations])).toEqual([]);
  });
});
