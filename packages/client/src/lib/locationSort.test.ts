// @vitest-environment node
import type { LocationNode, PlaceTypeDisplayConfig } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { sortLocationTree } from "./locationSort";

/** Minimal LocationNode factory for sort tests (only the fields the sorter reads matter). */
function node(name: string, placeType: string | null, children: LocationNode[] = []): LocationNode {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
    alternateNames: [],
    latitude: null,
    longitude: null,
    mapUrl: null,
    plusCode: null,
    placeType,
    countryCode: null,
    wikidataId: null,
    usesWikidataCoordinates: false,
    officialLink: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    sortOrder: 0,
    parentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    children,
  };
}

const names = (nodes: LocationNode[]): string[] => nodes.map(n => n.name);

describe("sortLocationTree", () => {
  it("returns the tree untouched in default mode", () => {
    const tree = [node("Tokyo", "city"), node("Japan", "country")];
    expect(sortLocationTree(tree, "default", {})).toBe(tree);
  });

  it("orders by the canonical place-type rank when unconfigured", () => {
    const tree = [node("Tokyo", "city"), node("Japan", "country"), node("Kanto", "region")];
    // canonical: country < region < city
    expect(names(sortLocationTree(tree, "place-type", {}))).toEqual(["Japan", "Kanto", "Tokyo"]);
  });

  it("respects configured sortOrder over the canonical rank", () => {
    const config: PlaceTypeDisplayConfig = {
      city: {
        displayMode: "pin",
        visible: true,
        sortOrder: 0,
      },
      country: {
        displayMode: "area",
        visible: true,
        sortOrder: 1,
      },
    };
    const tree = [node("Japan", "country"), node("Tokyo", "city")];
    expect(names(sortLocationTree(tree, "place-type", config))).toEqual(["Tokyo", "Japan"]);
  });

  it("sorts children recursively and does not mutate the input", () => {
    const tree = [node("Japan", "country", [node("Tokyo", "city"), node("Kanto", "region")])];
    const sorted = sortLocationTree(tree, "place-type", {});
    expect(names(sorted[0]!.children)).toEqual(["Kanto", "Tokyo"]);
    // original untouched
    expect(names(tree[0]!.children)).toEqual(["Tokyo", "Kanto"]);
  });

  it("breaks ties on name", () => {
    const tree = [node("Osaka", "city"), node("Kyoto", "city")];
    expect(names(sortLocationTree(tree, "place-type", {}))).toEqual(["Kyoto", "Osaka"]);
  });
});
