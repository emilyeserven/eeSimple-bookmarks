import type {
  Person,
  Bookmark,
  BookmarkImage,
  Category,
  CustomProperty,
  GenreMood,
  Language,
  Group,
  GroupType,
  Location,
  MediaType,
  Newsletter,
  Tag,
  Website,
  YouTubeChannel,
} from "@eesimple/types";

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
    editableViaCmdk: false,
    enabledInInbox: false,
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
    sectionsDefaultType: null,
    sectionsAllowedTypes: null,
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
    romanizedTitle: null,
    description: null,
    image: null,
    images: [],
    screenshot: null,
    screenshotSettings: null,
    reelArchive: null,
    imageAutoGrabError: null,
    categoryId: "cat",
    website: null,
    mediaType: null,
    language: null,
    languageUsages: [],
    youtubeChannel: null,
    newsletter: null,
    import: null,
    tags: [],
    genreMoods: [],
    blacklistedTagIds: [],
    numberValues: [],
    booleanValues: [],
    dateTimeValues: [],
    choicesValues: [],
    progressValues: [],
    sectionsValues: [],
    fileValues: [],
    textValues: [],
    people: [],
    group: null,
    bookId: null,
    movieId: null,
    tvShowId: null,
    episodeId: null,
    albumId: null,
    artistId: null,
    trackId: null,
    kavitaSeriesId: null,
    kavitaLibraryId: null,
    kavitaSeriesName: null,
    plexRatingKey: null,
    plexItemType: null,
    plexItemTitle: null,
    relationships: [],
    locations: [],
    blacklistedLocationIds: [],
    priority: 0,
    createdAt: NOW,
    updatedAt: null,
    ...overrides,
  };
}

/** A `BookmarkImage` wire object; the main image by default. Override only the fields a test cares about. */
export function makeBookmarkImage(overrides: Partial<BookmarkImage> = {}): BookmarkImage {
  return {
    id: "img",
    url: "https://example.com/image.webp",
    width: 1200,
    height: 800,
    source: "og",
    isMain: true,
    sortOrder: 0,
    ...overrides,
  };
}

/** A fully-populated `Location` (a root node with no coordinates by default). */
export function makeLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: "loc",
    name: "Location",
    romanizedName: null,
    slug: "location",
    alternateNames: [],
    latitude: null,
    longitude: null,
    mapUrl: null,
    plusCode: null,
    placeType: null,
    countryCode: null,
    wikidataId: null,
    usesWikidataCoordinates: false,
    officialLink: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    sortOrder: 0,
    parentId: null,
    tagIds: [],
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

/** A fully-populated `Tag` (a root tag with zero counts by default). */
export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: "tag",
    name: "Tag",
    romanizedName: null,
    slug: "tag",
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 0,
    ownBookmarkCount: 0,
    editableOnCard: false,
    excludeFromBackfill: false,
    ...overrides,
  };
}

/** A fully-populated `Website` (a non-built-in site with no associations by default). */
export function makeWebsite(overrides: Partial<Website> = {}): Website {
  return {
    id: "site",
    domain: "example.com",
    siteName: "Example",
    slug: "example",
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: NOW,
    bookmarkCount: 0,
    imageUrl: null,
    faviconAutoGrabError: null,
    category: null,
    tagIds: [],
    mediaTypeId: null,
    socialLinks: [],
    youtubeChannelIds: [],
    alternateNames: [],
    redirectResolutionFailure: false,
    ...overrides,
  };
}

/** A fully-populated `MediaType` (a root, non-built-in type by default). */
export function makeMediaType(overrides: Partial<MediaType> = {}): MediaType {
  return {
    id: "mt",
    name: "Media Type",
    romanizedName: null,
    slug: "media-type",
    icon: null,
    builtIn: false,
    sortOrder: 0,
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 0,
    ownBookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated `GenreMood` tree node (flat by default). */
export function makeGenreMood(overrides: Partial<GenreMood> = {}): GenreMood {
  return {
    id: "gm",
    name: "Genre",
    romanizedName: null,
    slug: "genre",
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 0,
    ownBookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated `Language`, built-in by default. */
export function makeLanguage(overrides: Partial<Language> = {}): Language {
  return {
    id: "lang",
    name: "English",
    isoCode: "en",
    slug: "english",
    builtIn: true,
    sortOrder: 0,
    createdAt: NOW,
    bookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated `YouTubeChannel` with no associations by default. */
export function makeYouTubeChannel(overrides: Partial<YouTubeChannel> = {}): YouTubeChannel {
  return {
    id: "chan",
    channelKey: "@channel",
    name: "Channel",
    slug: "channel",
    createdAt: NOW,
    bookmarkCount: 0,
    selfIds: [],
    imageUrl: null,
    category: null,
    tagIds: [],
    mediaTypeId: null,
    websiteIds: [],
    ...overrides,
  };
}

/** A fully-populated `Group` with no website or group-type association by default. */
export function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "pub",
    name: "Group",
    romanizedName: null,
    slug: "group",
    websiteId: null,
    website: null,
    groupTypeId: null,
    groupType: null,
    createdAt: NOW,
    bookmarkCount: 0,
    socialLinks: [],
    ...overrides,
  };
}

/** A fully-populated `GroupType`. */
export function makeGroupType(overrides: Partial<GroupType> = {}): GroupType {
  return {
    id: "gt",
    name: "Company",
    slug: "company",
    sortOrder: 0,
    createdAt: NOW,
    groupCount: 0,
    ...overrides,
  };
}

/** A fully-populated `Person` with no links or associations by default. */
export function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: "person",
    name: "Person",
    romanizedName: null,
    slug: "person",
    createdAt: NOW,
    bookmarkCount: 0,
    personWebsiteUrl: null,
    biographyUrl: null,
    imageUrl: null,
    socialLinks: [],
    youtubeChannelIds: [],
    websiteIds: [],
    groupIds: [],
    ...overrides,
  };
}

/** A fully-populated `Newsletter` with no defaults assigned. */
export function makeNewsletter(overrides: Partial<Newsletter> = {}): Newsletter {
  return {
    id: "nl",
    name: "Newsletter",
    slug: "newsletter",
    createdAt: NOW,
    bookmarkCount: 0,
    category: null,
    tagIds: [],
    mediaTypeId: null,
    ...overrides,
  };
}
