// @vitest-environment node
import type { PlexItemResult } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { matchPlexParentId } from "./plexParent";

function makeItem(overrides: Partial<PlexItemResult>): PlexItemResult {
  return {
    ratingKey: "1",
    type: "episode",
    title: "Pilot",
    year: null,
    librarySectionTitle: null,
    subtitle: null,
    groupTitle: null,
    parentTitle: null,
    parentRatingKey: null,
    grandparentTitle: null,
    grandparentRatingKey: null,
    ...overrides,
  };
}

const SHOWS = [
  {
    id: "show-a",
    name: "The Expanse",
    plexRatingKey: "100",
  },
  {
    id: "show-b",
    name: "Severance",
    plexRatingKey: "200",
  },
  {
    id: "show-b2",
    name: "Severance",
    plexRatingKey: "201",
  },
];

const GRANDPARENT = {
  ratingKeyField: "grandparentRatingKey",
  titleField: "grandparentTitle",
} as const;

describe("matchPlexParentId", () => {
  it("matches by parent rating key first", () => {
    const item = makeItem({
      grandparentRatingKey: "100",
      grandparentTitle: "Wrong Name",
    });
    expect(matchPlexParentId(item, SHOWS, GRANDPARENT)).toBe("show-a");
  });

  it("falls back to a unique name match when no rating key matches", () => {
    const item = makeItem({
      grandparentRatingKey: "999",
      grandparentTitle: "the expanse",
    });
    expect(matchPlexParentId(item, SHOWS, GRANDPARENT)).toBe("show-a");
  });

  it("returns null when the name is ambiguous (more than one match)", () => {
    const item = makeItem({
      grandparentRatingKey: null,
      grandparentTitle: "Severance",
    });
    expect(matchPlexParentId(item, SHOWS, GRANDPARENT)).toBeNull();
  });

  it("returns null when nothing matches", () => {
    const item = makeItem({
      grandparentRatingKey: "404",
      grandparentTitle: "Unknown Show",
    });
    expect(matchPlexParentId(item, SHOWS, GRANDPARENT)).toBeNull();
  });
});
