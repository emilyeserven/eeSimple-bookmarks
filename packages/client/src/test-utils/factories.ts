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
  LanguageUsage,
  LanguageUsageLevel,
  TranslationSource,
  MediaType,
  Newsletter,
  Tag,
  Taxonomy,
  TaxonomyTerm,
  ScanPipelineReport,
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
    dateTimeAllowYearMonth: false,
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
    itemInItemsMediaTypeTexts: null,
    itemInItemsSourcePropertyId: null,
    sectionsDefaultType: null,
    sectionsAllowedTypes: null,
    sectionsTiered: null,
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
    image: null,
    images: [],
    screenshot: null,
    screenshotSettings: null,
    imageDisplayPreference: "auto",
    reelArchive: null,
    imageAutoGrabError: null,
    categoryId: "cat",
    website: null,
    mediaType: null,
    languageUsages: [],
    names: [],
    youtubeChannel: null,
    newsletter: null,
    import: null,
    tags: [],
    genreMoods: [],
    taxonomyTerms: [],
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
    groups: [],
    kavitaSeriesId: null,
    kavitaLibraryId: null,
    kavitaSeriesName: null,
    plexRatingKey: null,
    plexItemType: null,
    plexItemTitle: null,
    isbn: null,
    year: null,
    wikidataId: null,
    wikipediaLinkEn: null,
    wikipediaLinkLocal: null,
    feedUrl: null,
    itunesId: null,
    itunesUrl: null,
    spotifyUrl: null,
    pocketCastsUuid: null,
    pocketCastsUrl: null,
    defaultLinkProvider: null,
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
    names: [],
    slug: "location",
    description: null,
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
    labeledWebsites: [],
    ...overrides,
  };
}

/** A fully-populated `Category`. */
export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat",
    name: "Category",
    names: [],
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
    names: [],
    slug: "tag",
    description: null,
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
    description: null,
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
    labeledWebsites: [],
    youtubeChannelIds: [],
    alternateNames: [],
    extensionFillRules: [],
    scanObservations: [],
    redirectResolutionFailure: false,
    scanUrlForIsbn: false,
    ...overrides,
  };
}

/** A fully-populated `MediaType` (a root, non-built-in type by default). */
export function makeMediaType(overrides: Partial<MediaType> = {}): MediaType {
  return {
    id: "mt",
    name: "Media Type",
    names: [],
    slug: "media-type",
    description: null,
    icon: null,
    builtIn: false,
    hidden: false,
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
    names: [],
    slug: "genre",
    description: null,
    parentId: null,
    createdAt: NOW,
    bookmarkCount: 0,
    ownBookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated user-configurable `Taxonomy` (hierarchical, multi-value by default). */
export function makeTaxonomy(overrides: Partial<Taxonomy> = {}): Taxonomy {
  return {
    id: "tax",
    name: "Genres & Moods",
    slug: "genres-moods",
    description: null,
    hierarchical: true,
    singleValue: false,
    builtIn: false,
    hidden: false,
    icon: null,
    showInSidebar: true,
    customLayout: false,
    sortOrder: 0,
    createdAt: NOW,
    termCount: 0,
    bookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated `TaxonomyTerm` (a root term by default). */
export function makeTaxonomyTerm(overrides: Partial<TaxonomyTerm> = {}): TaxonomyTerm {
  return {
    id: "term",
    taxonomyId: "tax",
    name: "Term",
    names: [],
    slug: "term",
    description: null,
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
    description: null,
    builtIn: true,
    sortOrder: 0,
    isFavorite: false,
    createdAt: NOW,
    bookmarkCount: 0,
    ...overrides,
  };
}

/** A fully-populated `LanguageUsageLevel`, an availability-kind built-in by default. */
export function makeLanguageUsageLevel(overrides: Partial<LanguageUsageLevel> = {}): LanguageUsageLevel {
  return {
    id: "level",
    name: "Subtitles",
    slug: "subtitles",
    description: null,
    kind: "availability",
    builtIn: true,
    hidden: false,
    sortOrder: 0,
    createdAt: NOW,
    usageCount: 0,
    ...overrides,
  };
}

/** A fully-populated `TranslationSource`, a built-in by default. */
export function makeTranslationSource(overrides: Partial<TranslationSource> = {}): TranslationSource {
  return {
    id: "source",
    name: "AI generated",
    slug: "ai-generated",
    builtIn: true,
    sortOrder: 0,
    createdAt: NOW,
    usageCount: 0,
    ...overrides,
  };
}

/** A fully-populated `LanguageUsage` association (English — Subtitles, no source/note by default). */
export function makeLanguageUsage(overrides: Partial<LanguageUsage> = {}): LanguageUsage {
  return {
    id: "usage",
    language: {
      id: "lang",
      name: "English",
      slug: "english",
      isoCode: "en",
    },
    level: {
      id: "level",
      name: "Subtitles",
      slug: "subtitles",
      kind: "availability",
    },
    translationSource: null,
    note: null,
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
    description: null,
    createdAt: NOW,
    bookmarkCount: 0,
    selfIds: [],
    imageUrl: null,
    category: null,
    tagIds: [],
    websiteIds: [],
    groupIds: [],
    labeledWebsites: [],
    ...overrides,
  };
}

/** A fully-populated `Group` with no website or group-type association by default. */
export function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: "pub",
    name: "Group",
    names: [],
    slug: "group",
    description: null,
    groupTypeId: null,
    groupType: null,
    createdAt: NOW,
    bookmarkCount: 0,
    socialLinks: [],
    labeledWebsites: [],
    sortOrder: 0,
    year: null,
    plexRatingKey: null,
    plexItemType: null,
    plexItemTitle: null,
    imageUrl: null,
    youtubeChannelIds: [],
    websiteIds: [],
    ...overrides,
  };
}

/** A fully-populated `GroupType`. */
export function makeGroupType(overrides: Partial<GroupType> = {}): GroupType {
  return {
    id: "gt",
    name: "Company",
    slug: "company",
    description: null,
    builtIn: false,
    hidden: false,
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
    names: [],
    slug: "person",
    description: null,
    createdAt: NOW,
    bookmarkCount: 0,
    imageUrl: null,
    socialLinks: [],
    labeledWebsites: [],
    youtubeChannelIds: [],
    websiteIds: [],
    groupIds: [],
    sortOrder: 0,
    year: null,
    plexRatingKey: null,
    plexItemType: null,
    plexItemTitle: null,
    ...overrides,
  };
}

/** A fully-populated `Newsletter` with no defaults assigned. */
export function makeNewsletter(overrides: Partial<Newsletter> = {}): Newsletter {
  return {
    id: "nl",
    name: "Newsletter",
    slug: "newsletter",
    description: null,
    createdAt: NOW,
    bookmarkCount: 0,
    category: null,
    tagIds: [],
    mediaTypeId: null,
    ...overrides,
  };
}

/**
 * A compact but representative `ScanPipelineReport`: a plain stage, a query-param-gated stage with a
 * first-non-null chain, a parallel node carrying a branch set, a layered-merge chain, and every
 * `GateBadge` live state (on / off / conditional). Override the pieces a story/test cares about.
 */
export function makeScanPipelineReport(overrides: Partial<ScanPipelineReport> = {}): ScanPipelineReport {
  return {
    description: {
      pipelineId: "scan",
      version: 1,
      endpoint: "GET /api/scan",
      nodes: [
        {
          kind: "stage",
          stage: {
            id: "validate-url",
            name: "URL validation",
            summary: "The pasted URL must be a valid http(s) URL before any work runs.",
            gate: {
              kind: "always",
            },
            live: {
              state: "on",
            },
          },
        },
        {
          kind: "stage",
          stage: {
            id: "resolve-redirect",
            name: "Redirect resolution",
            summary: "Follows the URL's redirect chain to its real destination.",
            detail: "The client turns this off per scan for ignore-listed domains.",
            gate: {
              kind: "queryParam",
              param: "resolveRedirect",
              defaultValue: true,
            },
            live: {
              state: "conditional",
              detail: "The client decides per scan (default on). 0 domains are on the redirect ignore list.",
            },
            precedences: [{
              id: "redirect-resolvers",
              title: "Redirect resolvers (first success wins)",
              mode: "first-non-null",
              sources: [
                {
                  id: "http-unwrap",
                  label: "HTTP redirect unwrap",
                },
                {
                  id: "browserless",
                  label: "Browserless fallback",
                  gate: {
                    kind: "connector",
                    connector: "hostedMetadata",
                  },
                  live: {
                    state: "off",
                    detail: "Connector not configured.",
                  },
                },
              ],
            }],
          },
        },
        {
          kind: "parallel",
          id: "parallel-fanout",
          label: "Run in parallel",
          lanes: [
            {
              id: "lane-duplicate-check",
              label: "Duplicate check",
              stages: [{
                id: "duplicate-check",
                name: "Duplicate check",
                summary: "Checks the resolved URL against existing bookmarks.",
                gate: {
                  kind: "always",
                },
                live: {
                  state: "on",
                },
              }],
            },
            {
              id: "lane-metadata",
              label: "Page metadata",
              stages: [],
              branchSet: {
                id: "metadata-branch",
                chooser: "Is the URL a YouTube video watch page?",
                branches: [
                  {
                    id: "metadata-branch-youtube",
                    label: "YouTube video",
                    stages: [{
                      id: "metadata-youtube",
                      name: "YouTube metadata",
                      summary: "Title/thumbnail/channel via keyless oEmbed.",
                      gate: {
                        kind: "always",
                      },
                      live: {
                        state: "on",
                      },
                    }],
                  },
                  {
                    id: "metadata-branch-generic",
                    label: "Any other page",
                    stages: [{
                      id: "metadata-generic",
                      name: "Generic page metadata",
                      summary: "Title, description, authors, and images from the page itself.",
                      gate: {
                        kind: "always",
                      },
                      live: {
                        state: "on",
                      },
                      registryRef: "oembedProviders",
                      precedences: [{
                        id: "metadata-sources",
                        title: "Metadata sources (later sources refine earlier ones)",
                        mode: "layered-merge",
                        sources: [
                          {
                            id: "html-scrape",
                            label: "HTML scrape",
                          },
                          {
                            id: "oembed",
                            label: "oEmbed",
                          },
                          {
                            id: "hosted-metadata",
                            label: "Hosted metadata provider",
                            gate: {
                              kind: "connector",
                              connector: "hostedMetadata",
                            },
                            live: {
                              state: "off",
                              detail: "Connector not configured.",
                            },
                          },
                        ],
                      }],
                    }],
                  },
                ],
              },
            },
            {
              id: "lane-isbn-generic",
              label: "Generic page ISBN",
              stages: [{
                id: "isbn-generic-page",
                name: "Generic page scrape",
                summary: "For opted-in sites, scans the page HTML for an ISBN.",
                gate: {
                  kind: "websiteFlag",
                  flag: "scanUrlForIsbn",
                },
                live: {
                  state: "off",
                  detail: "No website has \"Scan URL for ISBN\" on.",
                },
                registryRef: "isbnHtmlStrategies",
              }],
            },
          ],
        },
      ],
    },
    registries: {
      oembedProviders: [
        {
          name: "Vimeo",
        },
        {
          name: "Spotify",
        },
      ],
      contentKinds: ["youtube-video", "book", "social-account", "web-link"],
      isbnHtmlStrategies: [
        "JSON-LD isbn field",
        "ISBN-13 label in the page text",
        "ISBN-10 label in the page text (converted to ISBN-13)",
      ],
    },
    cache: {
      entries: 0,
      maxEntries: 500,
      ttlMs: 60_000,
    },
    generatedAt: NOW,
    ...overrides,
  };
}
