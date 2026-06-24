import type { Bookmark, Category, CustomProperty } from "@eesimple/types";

/**
 * Shared test/story factories for the full shared entity shapes.
 *
 * These are the single source of truth for constructing a complete `CustomProperty`, `Bookmark`, or
 * `Category` in tests, stories, and MSW mocks. Build with `make*({ ...overrides })` and override only
 * the fields a given test cares about — never re-list every field inline. When a field is added to or
 * removed from one of these shared types, the factory here is the **only** place that needs updating;
 * inline object literals scattered across test files silently drift and only surface as a CI
 * typecheck failure (see CLAUDE.md → Conventions).
 */

const NOW = "2026-06-01T00:00:00.000Z";

/** A fully-populated `CustomProperty` (a plain `number` type by default). */
export function makeCustomProperty(overrides: Partial<CustomProperty> = {}): CustomProperty {
  return {
    id: "prop",
    name: "Prop",
    slug: "prop",
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
    allCategories: false,
    mediaTypeIds: [],
    allMediaTypes: false,
    editableOnCard: false,
    showInForm: false,
    hiddenFromForm: false,
    showInListings: true,
    showInGallery: true,
    showInDetails: true,
    enabled: true,
    allowDefault: true,
    booleanLabelPreset: null,
    booleanTrueLabel: null,
    booleanFalseLabel: null,
    ratingMax: null,
    ratingAllowZero: false,
    ratingAllowHalf: false,
    ratingShowLabel: false,
    ratingLabel: null,
    choicesItems: [],
    choicesDisplay: null,
    choicesMultiple: false,
    itemInItemsBeforeText: null,
    itemInItemsBetweenText: null,
    itemInItemsAfterText: null,
    propertyGroupId: null,
    createdAt: NOW,
    ...overrides,
  };
}

/** A fully-populated `Bookmark` with empty value arrays. */
export function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: "bm",
    url: "https://example.com",
    originalUrl: null,
    title: "Example",
    description: null,
    newsletterContext: null,
    image: null,
    imageAutoGrabError: null,
    categoryId: "cat",
    website: null,
    mediaType: null,
    youtubeChannel: null,
    newsletter: null,
    import: null,
    tags: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    choicesValues: [],
    progressValues: [],
    fileValues: [],
    authors: [],
    relationships: [],
    priority: 0,
    createdAt: NOW,
    ...overrides,
  };
}

/** A fully-populated `Category`. */
export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat",
    name: "Category",
    slug: "category",
    description: null,
    icon: null,
    builtIn: false,
    isHomepage: false,
    createdAt: NOW,
    ...overrides,
  };
}
