import type { ResolvedFieldPlacement } from "./bookmarkCardValues";
import type { Bookmark, CardImageCorner, CustomProperty } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBookmarkValueItems } from "./bookmarkCardValues";

/** Build a single-key placement map for the test property. */
function placementMap(
  key: string,
  corner: CardImageCorner | null,
  hideLabel: boolean,
): Map<string, ResolvedFieldPlacement> {
  return new Map([[key, {
    zone: corner ? `image-${corner}` as const : "card",
    corner,
    scale: 1,
    mobileScale: null,
    hideLabel,
  }]]);
}

const NOW = "2026-06-01T00:00:00.000Z";

function property(overrides: Partial<CustomProperty>): CustomProperty {
  return {
    id: "prop",
    name: "Rating",
    slug: "rating",
    type: "number",
    builtIn: false,
    numberFormat: null,
    dateTimeFormat: null,
    quickFilterRange: null,
    description: null,
    numberMin: null,
    numberMax: null,
    unitSingular: null,
    unitPlural: null,
    valuePrefix: null,
    zeroLabel: null,
    maxLabel: null,
    operandPropertyIds: [],
    categoryIds: [],
    mediaTypeIds: [],
    allMediaTypes: false,
    showInForm: false,
    hiddenFromForm: false,
    showInListings: true,
    showInGallery: true,
    showInDetails: true,
    allCategories: false,
    editableOnCard: false,
    enabled: true,
    allowDefault: true,
    showIfFalse: false,
    booleanLabelPreset: null,
    booleanTrueLabel: null,
    booleanFalseLabel: null,
    showLabelColon: true,
    showValueBeforeLabel: false,
    hideLabel: false,
    clickableInView: false,
    ratingMax: null,
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: null,
    propertyGroupId: null,
    createdAt: NOW,
    ...overrides,
  };
}

function bookmarkWithNumber(propertyId: string, value: number): Bookmark {
  return {
    id: "bm",
    url: "https://example.com",
    originalUrl: null,
    title: "Example",
    description: null,
    image: null,
    imageAutoGrabError: null,
    categoryId: "cat",
    website: null,
    mediaType: null,
    youtubeChannel: null,
    tags: [],
    numberValues: [{
      propertyId,
      value,
    }],
    booleanValues: [],
    dateTimeValues: [],
    fileValues: [],
    relationships: [],
    priority: 0,
    createdAt: NOW,
  };
}

describe("buildBookmarkValueItems corner hide-label", () => {
  it("includes the property name when the label is not hidden", () => {
    const prop = property({});
    const [item] = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      placementMap(prop.id, "top-left", false),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") expect(item.label).toBe("Rating: 7");
  });

  it("drops the property name when hide-label is set on a corner placement", () => {
    const prop = property({});
    const [item] = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      placementMap(prop.id, "top-left", true),
    );
    expect(item.kind).toBe("badge");
    if (item.kind === "badge") expect(item.label).toBe("7");
  });

  it("omits a property absent from the placement map (hidden)", () => {
    const prop = property({});
    const items = buildBookmarkValueItems(
      bookmarkWithNumber(prop.id, 7),
      [prop],
      new Map(),
    );
    expect(items).toHaveLength(0);
  });
});
