import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

type Values = Pick<Bookmark, "numberValues" | "propertyTags">;

const bookmark: Values = {
  numberValues: [
    {
      propertyId: "prio",
      value: 5,
    },
  ],
  propertyTags: [
    {
      propertyId: "topic",
      id: "frontend",
      name: "frontend",
      parentId: "web",
    },
  ],
};

describe("bookmarkMatchesFilters", () => {
  it("passes when there are no active filters", () => {
    expect(bookmarkMatchesFilters(bookmark, [], [])).toBe(true);
  });

  it("keeps a bookmark whose number value is within range", () => {
    expect(bookmarkMatchesFilters(bookmark, [{
      propertyId: "prio",
      lo: 0,
      hi: 10,
    }], [])).toBe(true);
  });

  it("drops a bookmark whose number value is outside range", () => {
    expect(bookmarkMatchesFilters(bookmark, [{
      propertyId: "prio",
      lo: 6,
      hi: 10,
    }], [])).toBe(false);
  });

  it("drops a bookmark that lacks a value for an active number filter", () => {
    expect(bookmarkMatchesFilters(bookmark, [{
      propertyId: "other",
      lo: 0,
      hi: 1,
    }], [])).toBe(false);
  });

  it("matches a tiered-tags filter when the bookmark's tag is in the allowed subtree", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [{
        propertyId: "topic",
        allowedTagIds: ["web", "frontend", "backend"],
      }]),
    ).toBe(true);
  });

  it("drops a bookmark whose tag is outside the allowed subtree", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [{
        propertyId: "topic",
        allowedTagIds: ["backend"],
      }]),
    ).toBe(false);
  });
});
