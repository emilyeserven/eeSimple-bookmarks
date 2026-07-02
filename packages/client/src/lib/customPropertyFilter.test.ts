// @vitest-environment node
import type { Bookmark } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { bookmarkMatchesFilters } from "./customPropertyFilter";

type Values = Pick<Bookmark, "numberValues" | "booleanValues" | "dateTimeValues">;

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
  dateTimeValues: [
    {
      propertyId: "due",
      value: "2026-06-15",
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

  it("keeps a bookmark whose date value falls within the range (inclusive, open bounds)", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [], [{
        propertyId: "due",
        from: "2026-06-01",
        to: "2026-06-30",
      }]),
    ).toBe(true);
    expect(
      bookmarkMatchesFilters(bookmark, [], [], [{
        propertyId: "due",
        from: null,
        to: "2026-06-15",
      }]),
    ).toBe(true);
  });

  it("drops a bookmark whose date value is outside the range", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [], [{
        propertyId: "due",
        from: "2026-07-01",
        to: null,
      }]),
    ).toBe(false);
  });

  it("drops a bookmark that lacks a value for an active date filter", () => {
    expect(
      bookmarkMatchesFilters(bookmark, [], [], [{
        propertyId: "missing",
        from: "2026-01-01",
        to: null,
      }]),
    ).toBe(false);
  });
});
