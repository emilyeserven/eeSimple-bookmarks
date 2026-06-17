import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

type Values = Pick<Bookmark, "numberValues" | "booleanValues">;

const bookmark: Values = {
  numberValues: [
    {
      propertyId: "prio",
      value: 5,
    },
  ],
  booleanValues: [
    {
      propertyId: "reviewed",
      value: true,
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

  it("matches a boolean filter when the bookmark's value equals the filter", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [{
        propertyId: "reviewed",
        value: true,
      }]),
    ).toBe(true);
  });

  it("drops a bookmark whose boolean value differs from the filter", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [{
        propertyId: "reviewed",
        value: false,
      }]),
    ).toBe(false);
  });

  it("drops a bookmark that lacks a value for an active boolean filter", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [{
        propertyId: "missing",
        value: true,
      }]),
    ).toBe(false);
  });
});
