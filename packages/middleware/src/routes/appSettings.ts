import type {
  ImportBlacklistEntry,
  PlaceTypeColorConfig,
  PlaceTypeDisplayConfig,
  PlaceTypeIconConfig,
  PlaceTypeLevelGroupConfig,
  UpdateAdvancedSettingsInput,
  UpdateAiAutotagInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateBookmarkAddFormInput,
  UpdateBookmarkGraphInput,
  UpdateConnectorsSettingsInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdatePersonSourceLabelInput,
  UpdateAiBulkEditInput,
  UpdateBookmarkAiUpdateInput,
  UpdateScratchpadInput,
  UpdateSidebarCustomizationInput,
  UpdateTagReparentInput,
} from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { getDatabaseTableDetail, getDatabaseUsageReport } from "@/services/databaseUsage";
import { NotFoundError } from "@/utils/errors";
import {
  advancedBody,
  automationBody,
  bookmarkAddFormBody,
  bookmarkGraphBody,
  connectorsBody,
  displayPreferenceBody,
  homepageContentBody,
  ignoreListBody,
  importBlacklistBody,
  personSourceLabelBody,
  placeTypeColorsBody,
  placeTypeDisplayBody,
  placeTypeIconsBody,
  placeTypeLevelGroupsBody,
  sidebarCustomizationBody,
} from "./appSettingsSchema";
import {
  getAdvancedSettings,
  getAiAutotagSettings,
  getAiBulkEditSettings,
  getAiSummarizationSettings,
  getAutomationSettings,
  getBookmarkAddFormSettings,
  getBookmarkAiUpdateSettings,
  getBookmarkGraphSettings,
  getConnectorsSettings,
  getCustomStripParams,
  getDisplayPreferenceSettings,
  getHomepageContentSettings,
  getImportBlacklist,
  getPersonSourceLabelSettings,
  getPlaceTypeColors,
  getPlaceTypeDisplay,
  getPlaceTypeIcons,
  getPlaceTypeLevelGroups,
  getRedirectIgnoreList,
  getScratchpadSettings,
  getShortenerIgnoreList,
  getSidebarCustomizationSettings,
  getTagReparentSettings,
  updateAdvancedSettings,
  updateAiAutotagSettings,
  updateAiBulkEditSettings,
  updateAiSummarizationSettings,
  updateAutomationSettings,
  updateBookmarkAddFormSettings,
  updateBookmarkAiUpdateSettings,
  updateBookmarkGraphSettings,
  updateConnectorsSettings,
  updateCustomStripParams,
  updateDisplayPreferenceSettings,
  updateHomepageContentSettings,
  updateImportBlacklist,
  updatePersonSourceLabelSettings,
  updatePlaceTypeColors,
  updatePlaceTypeDisplay,
  updatePlaceTypeIcons,
  updatePlaceTypeLevelGroups,
  updateRedirectIgnoreList,
  updateScratchpadSettings,
  updateShortenerIgnoreList,
  updateSidebarCustomizationSettings,
  updateTagReparentSettings,
} from "@/services/appSettings";

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

  app.get("/api/app-settings/bookmark-add-form", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getBookmarkAddFormSettings());

  app.put("/api/app-settings/bookmark-add-form", {
    schema: {
      tags: ["app-settings"],
      body: bookmarkAddFormBody,
    },
  }, async req => updateBookmarkAddFormSettings(req.body as UpdateBookmarkAddFormInput));

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

  app.get("/api/app-settings/bookmark-graph", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getBookmarkGraphSettings());

  app.put("/api/app-settings/bookmark-graph", {
    schema: {
      tags: ["app-settings"],
      body: bookmarkGraphBody,
    },
  }, async req => updateBookmarkGraphSettings(req.body as UpdateBookmarkGraphInput));

  app.get("/api/app-settings/person-source-labels", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getPersonSourceLabelSettings());

  app.put("/api/app-settings/person-source-labels", {
    schema: {
      tags: ["app-settings"],
      body: personSourceLabelBody,
    },
  }, async req => updatePersonSourceLabelSettings(req.body as UpdatePersonSourceLabelInput));

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
  }, async (req) => {
    const {
      tableName,
    } = req.params as { tableName: string };
    const detail = await getDatabaseTableDetail(tableName);
    if (!detail) {
      throw new NotFoundError("Table");
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
        required: ["aiSummarizationPrompt", "aiSummarizationSuggestTags"],
        additionalProperties: false,
        properties: {
          aiSummarizationPrompt: {
            type: "string",
          },
          aiSummarizationSuggestTags: {
            type: "boolean",
          },
        },
      },
    },
  }, async req => updateAiSummarizationSettings(req.body as UpdateAiSummarizationInput));

  app.get("/api/app-settings/scratchpad", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getScratchpadSettings());

  app.put("/api/app-settings/scratchpad", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["scratchpadText"],
        additionalProperties: false,
        properties: {
          scratchpadText: {
            type: "string",
          },
        },
      },
    },
  }, async req => updateScratchpadSettings(req.body as UpdateScratchpadInput));

  app.get("/api/app-settings/ai-autotag", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getAiAutotagSettings());

  app.put("/api/app-settings/ai-autotag", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["aiAutotagPrompt", "aiAutotagIncludeExistingTags"],
        additionalProperties: false,
        properties: {
          aiAutotagPrompt: {
            type: "string",
          },
          aiAutotagIncludeExistingTags: {
            type: "boolean",
          },
        },
      },
    },
  }, async req => updateAiAutotagSettings(req.body as UpdateAiAutotagInput));

  app.get("/api/app-settings/tag-reparent", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getTagReparentSettings());

  app.put("/api/app-settings/tag-reparent", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["tagReparentPrompt"],
        additionalProperties: false,
        properties: {
          tagReparentPrompt: {
            type: "string",
          },
        },
      },
    },
  }, async req => updateTagReparentSettings(req.body as UpdateTagReparentInput));

  app.get("/api/app-settings/bookmark-ai-update", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getBookmarkAiUpdateSettings());

  app.put("/api/app-settings/bookmark-ai-update", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["bookmarkAiUpdatePrompt"],
        additionalProperties: false,
        properties: {
          bookmarkAiUpdatePrompt: {
            type: "string",
          },
        },
      },
    },
  }, async req => updateBookmarkAiUpdateSettings(req.body as UpdateBookmarkAiUpdateInput));

  app.get("/api/app-settings/ai-bulk-edit", {
    schema: {
      tags: ["app-settings"],
    },
  }, async () => getAiBulkEditSettings());

  app.put("/api/app-settings/ai-bulk-edit", {
    schema: {
      tags: ["app-settings"],
      body: {
        type: "object",
        required: ["aiBulkEditPrompt"],
        additionalProperties: false,
        properties: {
          aiBulkEditPrompt: {
            type: "string",
          },
        },
      },
    },
  }, async req => updateAiBulkEditSettings(req.body as UpdateAiBulkEditInput));

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
