import type {
  ImportBlacklistEntry,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroupConfig,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import { IMPORT_BLACKLIST_KINDS, LOCATION_DISPLAY_MODES, LOCATION_MAP_LEVEL_MODES } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { getDatabaseTableDetail, getDatabaseUsageReport } from "@/services/databaseUsage";
import {
  getAdvancedSettings,
  getAiSummarizationSettings,
  getAutomationSettings,
  getConnectorsSettings,
  getCustomStripParams,
  getDisplayPreferenceSettings,
  getHomepageContentSettings,
  getImportBlacklist,
  getPlaceTypeColors,
  getPlaceTypeDisplay,
  getPlaceTypeIcons,
  getPlaceTypeLevelGroups,
  getRedirectIgnoreList,
  getShortenerIgnoreList,
  getSidebarCustomizationSettings,
  updateAdvancedSettings,
  updateAiSummarizationSettings,
  updateAutomationSettings,
  updateConnectorsSettings,
  updateCustomStripParams,
  updateDisplayPreferenceSettings,
  updateHomepageContentSettings,
  updateImportBlacklist,
  updatePlaceTypeColors,
  updatePlaceTypeDisplay,
  updatePlaceTypeIcons,
  updatePlaceTypeLevelGroups,
  updateRedirectIgnoreList,
  updateShortenerIgnoreList,
  updateSidebarCustomizationSettings,
} from "@/services/appSettings";

const stringArray = {
  type: "array",
  items: {
    type: "string",
  },
} as const;

const ignoreListBody = {
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

const importBlacklistBody = {
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

const homepageContentBody = {
  type: "object",
  required: [
    "homepageText",
    "homepageTextWidth",
    "bookmarkQuickAddEnabled",
    "bookmarkQuickAddWidth",
    "bookmarkQuickAddDisplay",
    "homepageHeaderHidden",
    "homepageTextEnabled",
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
  },
} as const;

const advancedBody = {
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

const sidebarCustomizationBody = {
  type: "object",
  required: [
    "hiddenCategoryIds",
    "seeMoreCategoryIds",
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
    hiddenCategoryIds: stringArray,
    seeMoreCategoryIds: stringArray,
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

const automationBody = {
  type: "object",
  required: ["autoFetchTitle", "autoFetchImage", "autoApplyTitleTags", "autoApplyTitleLocations", "sidebarOpenModifier"],
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
    sidebarOpenModifier: {
      type: "string",
      enum: ["alt", "ctrl", "shift", "meta"],
    },
  },
} as const;

// The per-placeType map display config: a free-keyed object (placeType → its setting). The
// `displayMode` enum derives from the shared LOCATION_DISPLAY_MODES tuple (don't hand-mirror it).
const placeTypeDisplayBody = {
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

const connectorsBody = {
  type: "object",
  required: ["hostedMetadataEndpoint", "hostedMetadataProvider", "hostedMetadataApiKey", "archiveBoxEndpoint", "kavitaEndpoint", "kavitaApiKey", "plexEndpoint", "plexToken", "youtubeApiKey", "imageUrlBlacklist"],
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
  },
} as const;

const displayPreferenceBody = {
  type: "object",
  required: [
    "bookmarkDetailImageSize",
    "bookmarkDetailVideoSize",
    "bookmarkDetailLayout",
    "filtersInDrawer",
    "filtersHidden",
    "panelPinned",
    "drawerUnpinnedBreakpoints",
    "croppedWidth",
    "croppedHeight",
    "showRomanizedByDefault",
    "sortByRomanized",
    "minAreaPinThresholdKm2",
    "bookmarksPerPage",
    "mapPinScale",
    "screenshotDefaultDelayMs",
    "screenshotDefaultWidth",
    "screenshotDefaultHeight",
    "screenshotDefaultScrollDistance",
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
    filtersInDrawer: {
      type: "boolean",
    },
    filtersHidden: {
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
    showRomanizedByDefault: {
      type: "boolean",
    },
    sortByRomanized: {
      type: "boolean",
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
  },
} as const;

// The named place-type level groups: an ordered array of groups, each grouping member place types
// under a display setting. The `displayMode` enum derives from LOCATION_DISPLAY_MODES (don't mirror).
const placeTypeLevelGroupsBody = {
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
const placeTypeIconsBody = {
  type: "object",
  additionalProperties: {
    type: "string",
  },
} as const;

// The per-placeType map color overrides: a sparse map of placeType key → `#rrggbb` hex color.
const placeTypeColorsBody = {
  type: "object",
  additionalProperties: {
    type: "string",
  },
} as const;

/** Global app-settings endpoints, mounted under `/api/app-settings`. */
export async function appSettingsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/app-settings/shortener-ignore-list", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getShortenerIgnoreList());

  app.put("/api/app-settings/shortener-ignore-list", {
    schema: {
      tags: ["app-settings"],
      body: ignoreListBody,
    },
  }, async (req) => {
    const {
      domains,
    } = req.body as { domains: string[] };
    return updateShortenerIgnoreList(domains);
  });

  app.get("/api/app-settings/custom-strip-params", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getCustomStripParams());

  app.put("/api/app-settings/custom-strip-params", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["params"],
        additionalProperties: false,
        properties: {
          params: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    },
  }, async (req) => {
    const {
      params,
    } = req.body as { params: string[] };
    return updateCustomStripParams(params);
  });

  app.get("/api/app-settings/redirect-ignore-list", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getRedirectIgnoreList());

  app.put("/api/app-settings/redirect-ignore-list", {
    schema: {
      tags: ["app-settings"],
      body: ignoreListBody,
    },
  }, async (req) => {
    const {
      domains,
    } = req.body as { domains: string[] };
    return updateRedirectIgnoreList(domains);
  });

  app.get("/api/app-settings/import-blacklist", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getImportBlacklist());

  app.put("/api/app-settings/import-blacklist", {
    schema: {
      tags: ["app-settings"],
      body: importBlacklistBody,
    },
  }, async (req) => {
    const {
      entries,
    } = req.body as { entries: ImportBlacklistEntry[] };
    return updateImportBlacklist(entries);
  });

  app.get("/api/app-settings/homepage-content", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getHomepageContentSettings());

  app.put("/api/app-settings/homepage-content", {
    schema: {
      tags: ["app-settings"],
      body: homepageContentBody,
    },
  }, async req => updateHomepageContentSettings(req.body as UpdateHomepageContentInput));

  app.get("/api/app-settings/advanced", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getAdvancedSettings());

  app.put("/api/app-settings/advanced", {
    schema: {
      tags: ["app-settings"],
      body: advancedBody,
    },
  }, async req => updateAdvancedSettings(req.body as UpdateAdvancedSettingsInput));

  app.get("/api/app-settings/sidebar-customization", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getSidebarCustomizationSettings());

  app.put("/api/app-settings/sidebar-customization", {
    schema: {
      tags: ["app-settings"],
      body: sidebarCustomizationBody,
    },
  }, async req => updateSidebarCustomizationSettings(req.body as UpdateSidebarCustomizationInput));

  app.get("/api/app-settings/automation", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getAutomationSettings());

  app.put("/api/app-settings/automation", {
    schema: {
      tags: ["app-settings"],
      body: automationBody,
    },
  }, async req => updateAutomationSettings(req.body as UpdateAutomationInput));

  app.get("/api/app-settings/location-display", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getPlaceTypeDisplay());

  app.put("/api/app-settings/location-display", {
    schema: {
      tags: ["app-settings"],
      body: placeTypeDisplayBody,
    },
  }, async req => updatePlaceTypeDisplay(req.body as PlaceTypeDisplayConfig));

  app.get("/api/app-settings/location-level-groups", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getPlaceTypeLevelGroups());

  app.put("/api/app-settings/location-level-groups", {
    schema: {
      tags: ["app-settings"],
      body: placeTypeLevelGroupsBody,
    },
  }, async req => updatePlaceTypeLevelGroups(req.body as PlaceTypeLevelGroupConfig));

  app.get("/api/app-settings/place-type-icons", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getPlaceTypeIcons());

  app.put("/api/app-settings/place-type-icons", {
    schema: {
      tags: ["app-settings"],
      body: placeTypeIconsBody,
    },
  }, async req => updatePlaceTypeIcons(req.body as PlaceTypeIconConfig));

  app.get("/api/app-settings/place-type-colors", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getPlaceTypeColors());

  app.put("/api/app-settings/place-type-colors", {
    schema: {
      tags: ["app-settings"],
      body: placeTypeColorsBody,
    },
  }, async req => updatePlaceTypeColors(req.body as PlaceTypeColorConfig));

  app.get("/api/app-settings/display-preferences", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getDisplayPreferenceSettings());

  app.put("/api/app-settings/display-preferences", {
    schema: {
      tags: ["app-settings"],
      body: displayPreferenceBody,
    },
  }, async req => updateDisplayPreferenceSettings(req.body as UpdateDisplayPreferenceInput));

  app.get("/api/app-settings/database-usage", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getDatabaseUsageReport());

  app.get("/api/app-settings/database-usage/:tableName", {
    schema: {
      tags: ["app-settings"],
    },
  }, async (req, reply) => {
    const {
      tableName,
    } = req.params as { tableName: string };
    const detail = await getDatabaseTableDetail(tableName);
    if (!detail) {
      return reply.code(404).send({
        message: "Table not found",
      });
    }
    return detail;
  });

  app.get("/api/app-settings/ai-summarization", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getAiSummarizationSettings());

  app.put("/api/app-settings/ai-summarization", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["aiSummarizationPrompt"],
        additionalProperties: false,
        properties: {
          aiSummarizationPrompt: {
            type: "string",
          },
        },
      },
    },
  }, async req => updateAiSummarizationSettings(req.body as UpdateAiSummarizationInput));

  app.get("/api/app-settings/connectors", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getConnectorsSettings());

  app.put("/api/app-settings/connectors", {
    schema: {
      tags: ["app-settings"],
      body: connectorsBody,
    },
  }, async req => updateConnectorsSettings(req.body as UpdateConnectorsSettingsInput));
}
