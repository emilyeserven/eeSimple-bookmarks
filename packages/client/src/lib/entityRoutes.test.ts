import { describe, expect, it } from "vitest";

import type { EntityRouteKind } from "./entityRoutes";

import { ENTITY_ROUTES, matchEntityRoute } from "./entityRoutes";

const EXPECTED_KINDS: EntityRouteKind[] = [
  "category",
  "tag",
  "website",
  "media-type",
  "genre-mood",
  "language",
  "location",
  "place-type",
  "location-relation",
  "youtube-channel",
  "newsletter",
  "person",
  "group",
  "group-type",
  "relationship-type",
  "custom-property",
  "autofill",
  "import-rule",
  "saved-filter",
  "card-display-rule",
];

describe("entityRoutes", () => {
  it("derives exactly one route per EntityRouteKind", () => {
    const kinds = ENTITY_ROUTES.map(r => r.kind);
    expect(new Set(kinds)).toEqual(new Set(EXPECTED_KINDS));
    expect(kinds.length).toBe(EXPECTED_KINDS.length);
  });

  it("has a unique prefix per route", () => {
    const prefixes = ENTITY_ROUTES.map(r => r.prefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("returns null for a bare listing path", () => {
    for (const route of ENTITY_ROUTES) {
      expect(matchEntityRoute(route.prefix)).toBeNull();
    }
  });

  it("returns null for create/backfill sub-pages", () => {
    for (const route of ENTITY_ROUTES) {
      expect(matchEntityRoute(`${route.prefix}/new`)).toBeNull();
      expect(matchEntityRoute(`${route.prefix}/backfill`)).toBeNull();
    }
  });

  it("returns null for an unrelated path", () => {
    expect(matchEntityRoute("/bookmarks/some-id")).toBeNull();
    expect(matchEntityRoute("/")).toBeNull();
  });

  it("matches every registered route's detail path to its slug", () => {
    for (const route of ENTITY_ROUTES) {
      expect(matchEntityRoute(`${route.prefix}/dummy-slug`)).toEqual({
        route,
        slug: "dummy-slug",
      });
    }
  });
});
