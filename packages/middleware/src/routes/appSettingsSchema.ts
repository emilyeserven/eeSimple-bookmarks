/**
 * Shared Fastify JSON-Schema body fragments for the app-settings routes
 * (`appSettings.ts`) — split out so the route file stays focused on the plugin
 * registrations (like `bookmarkParamsSchema.ts` / `conditionSchema.ts`, defined once
 * here rather than inline above the route bodies).
 */

import { BOOKMARK_ADD_FORM_PLACEMENTS, HOMEPAGE_WIDGETS, IMPORT_BLACKLIST_KINDS, INTERFACE_LANGUAGES, LOCATION_DISPLAY_MODES, LOCATION_MAP_LEVEL_MODES } from "@eesimple/types";

export const stringArray = {
  type: "array",
  items: {
    type: "string",
  },
} as const;

export const ignoreListBody = {
  type: "object",
  required: ["domains"],
  additionalProperties: false,
  properties: {
    domains: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
} as const;

export const importBlacklistBody = {
  type: "object",
  required: ["entries"],
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        required: ["kind", "value"],
        additionalProperties: false,
        properties: {
          kind: {
            type: "string",
            enum: [...IMPORT_BLACKLIST_KINDS],
          },
          value: {
            type: "string",
          },
        },
      },
    },
  },
} as const;

export const homepageContentBody = {
  type: "object",
  required: [
    "homepageText",
    "homepageTextWidth",
    "bookmarkQuickAddEnabled",
    "bookmarkQuickAddWidth",
    "bookmarkQuickAddDisplay",
    "homepageHeaderHidden",
    "homepageTextEnabled",
    "searchEnabled",
    "searchWidth",
    "widgetOrder",
  ],
  additionalProperties: false,
  properties: {
    homepageText: {
      type: "string",
    },
    homepageTextWidth: {
      type: "string",
      enum: ["full", "half"],
    },
    bookmarkQuickAddEnabled: {
      type: "boolean",
    },
    bookmarkQuickAddWidth: {
      type: "string",
      enum: ["full", "half"],
    },
    bookmarkQuickAddDisplay: {
      type: "string",
      enum: ["collapsible", "expanded"],
    },
    homepageHeaderHidden: {
      type: "boolean",
    },
    homepageTextEnabled: {
      type: "boolean",
    },
    searchEnabled: {
      type: "boolean",
    },
    searchWidth: {
      type: "string",
      enum: ["full", "half"],
    },
    widgetOrder: {
      type: "array",
      items: {
        type: "string",
        enum: [...HOMEPAGE_WIDGETS],
      },
    },
  },
} as const;

export const advancedBody = {
  type: "object",
  required: [
    "coolifyLinkEnabled",
    "coolifyUrl",
    "docsLinkEnabled",
    "storybookLinkEnabled",
    "drizzleGatewayLinkEnabled",
    "drizzleGatewayUrl",
    "githubLinkEnabled",
  ],
  additionalProperties: false,
  properties: {
    coolifyLinkEnabled: {
      type: "boolean",
    },
    coolifyUrl: {
      type: "string",
    },
    docsLinkEnabled: {
      type: "boolean",
    },
    storybookLinkEnabled: {
      type: "boolean",
    },
    drizzleGatewayLinkEnabled: {
      type: "boolean",
    },
    drizzleGatewayUrl: {
      type: "string",
    },
    githubLinkEnabled: {
      type: "boolean",
    },
  },
} as const;

export const sidebarCustomizationBody = {
  type: "object",
  required: [
    "hiddenTaxonomyItems",
    "seeMoreTaxonomyItems",
    "hiddenCustomizationItems",
    "seeMoreCustomizationItems",
    "hiddenManagementItems",
    "hiddenSidebarGroups",
    "hiddenConnectorLinks",
    "seeMoreConnectorLinks",
  ],
  additionalProperties: false,
  properties: {
    hiddenTaxonomyItems: stringArray,
    seeMoreTaxonomyItems: stringArray,
    hiddenCustomizationItems: stringArray,
    seeMoreCustomizationItems: stringArray,
    hiddenManagementItems: stringArray,
    hiddenSidebarGroups: stringArray,
    hiddenConnectorLinks: stringArray,
    seeMoreConnectorLinks: stringArray,
  },
} as const;

// Add Bookmark form field placement (Settings → Display → Add Bookmark Form). The placement enum
// derives from the shared BOOKMARK_ADD_FORM_PLACEMENTS tuple (don't hand-mirror it).
export const placementMap = {
  type: "object",
  additionalProperties: {
    type: "string",
    enum: [...BOOKMARK_ADD_FORM_PLACEMENTS],
  },
} as const;
// One conditional placement override: a condition tree (shared `conditionTree#` schema) plus two
// sparse placement maps. Kept optional on the body so older clients that don't send `advancedRules`
// still validate.
export const advancedRuleSchema = {
  type: "object",
  required: ["id", "conditions", "standardFieldPlacements", "propertyPlacements", "sortOrder"],
  additionalProperties: false,
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    conditions: {
      $ref: "conditionTree#",
    },
    standardFieldPlacements: placementMap,
    propertyPlacements: placementMap,
    sortOrder: {
      type: "number",
    },
  },
} as const;
export const bookmarkAddFormBody = {
  type: "object",
  required: ["standardFieldPlacements", "builtInPropertyPlacements"],
  additionalProperties: false,
  properties: {
    standardFieldPlacements: placementMap,
    builtInPropertyPlacements: placementMap,
    revealAutofilledInMain: {
      type: "boolean",
    },
    advancedRules: {
      type: "array",
      items: advancedRuleSchema,
    },
  },
} as const;

export const automationBody = {
  type: "object",
  required: ["autoFetchTitle", "autoFetchImage", "autoApplyTitleTags", "autoApplyTitleLocations", "shareBypassInbox", "sidebarOpenModifier", "defaultCategoryId"],
  additionalProperties: false,
  properties: {
    autoFetchTitle: {
      type: "boolean",
    },
    autoFetchImage: {
      type: "boolean",
    },
    autoApplyTitleTags: {
      type: "boolean",
    },
    autoApplyTitleLocations: {
      type: "boolean",
    },
    shareBypassInbox: {
      type: "boolean",
    },
    sidebarOpenModifier: {
      type: "string",
      enum: ["alt", "ctrl", "shift", "meta"],
    },
    defaultCategoryId: {
      type: ["string", "null"],
    },
  },
} as const;

// A single relatedness dimension's weight: Off / Low / Medium / High (0–3).
export const graphWeight = {
  type: "integer",
  enum: [0, 1, 2, 3],
} as const;

export const bookmarkGraphBody = {
  type: "object",
  required: ["weights", "maxRelated", "showSecondLayer"],
  additionalProperties: false,
  properties: {
    weights: {
      type: "object",
      required: ["tags", "category", "mediaType", "genreMoods", "people", "groups", "website", "youtubeChannel"],
      additionalProperties: false,
      properties: {
        tags: graphWeight,
        category: graphWeight,
        mediaType: graphWeight,
        genreMoods: graphWeight,
        people: graphWeight,
        groups: graphWeight,
        website: graphWeight,
        youtubeChannel: graphWeight,
      },
    },
    maxRelated: {
      type: "integer",
      minimum: 1,
      maximum: 100,
    },
    showSecondLayer: {
      type: "boolean",
    },
  },
} as const;

export const personSourceLabelBody = {
  type: "object",
  required: ["websiteLabel", "biographyLabel"],
  additionalProperties: false,
  properties: {
    websiteLabel: {
      type: "string",
      minLength: 1,
    },
    biographyLabel: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

// The per-placeType map display config: a free-keyed object (placeType → its setting). The
// `displayMode` enum derives from the shared LOCATION_DISPLAY_MODES tuple (don't hand-mirror it).
export const placeTypeDisplayBody = {
  type: "object",
  additionalProperties: {
    type: "object",
    required: ["displayMode", "visible", "sortOrder"],
    additionalProperties: false,
    properties: {
      displayMode: {
        type: "string",
        enum: [...LOCATION_DISPLAY_MODES],
      },
      visible: {
        type: "boolean",
      },
      sortOrder: {
        type: "number",
      },
      color: {
        type: "string",
        nullable: true,
      },
    },
  },
} as const;

export const connectorsBody = {
  type: "object",
  required: ["hostedMetadataEndpoint", "hostedMetadataProvider", "hostedMetadataApiKey", "archiveBoxEndpoint", "kavitaEndpoint", "kavitaSidebarUrl", "kavitaApiKey", "plexEndpoint", "plexToken", "youtubeApiKey", "imageUrlBlacklist", "useNoCookieYoutubeEmbeds"],
  additionalProperties: false,
  properties: {
    hostedMetadataEndpoint: {
      type: "string",
    },
    hostedMetadataProvider: {
      type: "string",
    },
    hostedMetadataApiKey: {
      // null = leave the stored key unchanged; "" = clear; any other string = set new key.
      type: ["string", "null"],
    },
    archiveBoxEndpoint: {
      // ArchiveBox base URL; "" clears it. No key analog — link-outs are tokenless.
      type: "string",
    },
    kavitaEndpoint: {
      // Kavita base URL; "" clears it.
      type: "string",
    },
    kavitaSidebarUrl: {
      // Browser-facing URL for the sidebar Kavita link-out; "" clears it (link falls back to kavitaEndpoint).
      type: "string",
    },
    kavitaApiKey: {
      // null = leave the stored key unchanged; "" = clear; any other string = set new key.
      type: ["string", "null"],
    },
    plexEndpoint: {
      // Plex base URL; "" clears it.
      type: "string",
    },
    plexToken: {
      // null = leave the stored token unchanged; "" = clear; any other string = set new token.
      type: ["string", "null"],
    },
    youtubeApiKey: {
      // null = leave the stored key unchanged; "" = clear; any other string = set new key.
      type: ["string", "null"],
    },
    imageUrlBlacklist: {
      // Patterns (substring or `*` glob) that exclude matching candidate images from a URL scan.
      type: "array",
      items: {
        type: "string",
      },
    },
    useNoCookieYoutubeEmbeds: {
      // true = embed via the privacy-enhanced youtube-nocookie.com host; false = plain youtube.com.
      type: "boolean",
    },
  },
} as const;

export const displayPreferenceBody = {
  type: "object",
  required: [
    "bookmarkDetailImageSize",
    "bookmarkDetailVideoSize",
    "bookmarkDetailLayout",
    "bookmarkCardThumbnailSize",
    "interfaceLanguage",
    "searchBoxPinned",
    "panelPinned",
    "drawerUnpinnedBreakpoints",
    "croppedWidth",
    "croppedHeight",
    "hanScriptLanguage",
    "minAreaPinThresholdKm2",
    "bookmarksPerPage",
    "mapPinScale",
    "screenshotDefaultDelayMs",
    "screenshotDefaultWidth",
    "screenshotDefaultHeight",
    "screenshotDefaultScrollDistance",
    "maxImageEdge",
    "imageQuality",
  ],
  additionalProperties: false,
  properties: {
    bookmarkDetailImageSize: {
      type: "string",
      enum: ["small", "medium", "large"],
    },
    bookmarkDetailVideoSize: {
      type: "string",
      enum: ["standard", "half", "twoThirds", "fullwidth"],
    },
    bookmarkDetailLayout: {
      type: "string",
      enum: ["single", "tabbed"],
    },
    bookmarkCardThumbnailSize: {
      type: "string",
      enum: ["small", "medium", "large"],
    },
    interfaceLanguage: {
      type: "string",
      enum: [...INTERFACE_LANGUAGES],
    },
    searchBoxPinned: {
      type: "boolean",
    },
    panelPinned: {
      type: "boolean",
    },
    drawerUnpinnedBreakpoints: {
      type: "array",
      items: {
        type: "integer",
        minimum: 1,
      },
    },
    croppedWidth: {
      type: "integer",
      minimum: 1,
    },
    croppedHeight: {
      type: "integer",
      minimum: 1,
    },
    customPropertyTypeIcons: {
      oneOf: [
        {
          type: "null",
        },
        {
          type: "object",
          additionalProperties: {
            type: "string",
          },
        },
      ],
    },
    onDemandFilters: {
      type: "array",
      items: {
        type: "string",
      },
    },
    filterOrder: {
      type: "array",
      items: {
        type: "string",
      },
    },
    mobileHiddenFilters: {
      type: "array",
      items: {
        type: "string",
      },
    },
    defaultBookmarkSort: {
      oneOf: [
        {
          type: "null",
        },
        {
          type: "object",
          required: ["primary"],
          additionalProperties: false,
          properties: {
            primary: {
              type: "object",
              required: ["field", "direction"],
              additionalProperties: false,
              properties: {
                field: {
                  type: "string",
                },
                direction: {
                  type: "string",
                  enum: ["asc", "desc"],
                },
              },
            },
            secondary: {
              type: "object",
              required: ["field", "direction"],
              additionalProperties: false,
              properties: {
                field: {
                  type: "string",
                },
                direction: {
                  type: "string",
                  enum: ["asc", "desc"],
                },
              },
            },
          },
        },
      ],
    },
    hanScriptLanguage: {
      type: "string",
      enum: ["ja", "zh"],
    },
    secondaryLanguageId: {
      type: ["string", "null"],
    },
    fallbackLanguageId: {
      type: ["string", "null"],
    },
    minAreaPinThresholdKm2: {
      type: "number",
      minimum: 0,
    },
    bookmarksPerPage: {
      type: "integer",
      minimum: 1,
    },
    mapPinScale: {
      type: "number",
      minimum: 0.5,
      maximum: 2,
    },
    screenshotDefaultDelayMs: {
      type: "integer",
      minimum: 0,
      maximum: 30000,
    },
    screenshotDefaultWidth: {
      type: "integer",
      minimum: 200,
      maximum: 3840,
    },
    screenshotDefaultHeight: {
      type: "integer",
      minimum: 200,
      maximum: 2160,
    },
    screenshotDefaultScrollDistance: {
      type: "integer",
      minimum: 0,
      maximum: 10000,
    },
    maxImageEdge: {
      type: "integer",
      minimum: 200,
      maximum: 4000,
    },
    imageQuality: {
      type: "integer",
      minimum: 1,
      maximum: 100,
    },
  },
} as const;

// The named place-type level groups: an ordered array of groups, each grouping member place types
// under a display setting. The `displayMode` enum derives from LOCATION_DISPLAY_MODES (don't mirror).
export const placeTypeLevelGroupsBody = {
  type: "array",
  items: {
    type: "object",
    required: ["id", "name", "placeTypes", "displayMode", "visible", "sortOrder"],
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
      },
      name: {
        type: "string",
      },
      placeTypes: {
        type: "array",
        items: {
          type: "string",
        },
      },
      displayMode: {
        type: "string",
        enum: [...LOCATION_DISPLAY_MODES],
      },
      visible: {
        type: "boolean",
      },
      showOnMainMap: {
        type: "boolean",
      },
      levelMode: {
        type: "string",
        enum: [...LOCATION_MAP_LEVEL_MODES],
      },
      defaultHiddenGroupIds: {
        type: "array",
        items: {
          type: "string",
        },
      },
      sortOrder: {
        type: "number",
      },
      color: {
        type: "string",
        nullable: true,
      },
    },
  },
} as const;

// The per-placeType map-pin icon overrides: a sparse map of placeType key → Lucide icon name.
export const placeTypeIconsBody = {
  type: "object",
  additionalProperties: {
    type: "string",
  },
} as const;

// The per-placeType map color overrides: a sparse map of placeType key → `#rrggbb` hex color.
export const placeTypeColorsBody = {
  type: "object",
  additionalProperties: {
    type: "string",
  },
} as const;
