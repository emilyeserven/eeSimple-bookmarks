import type {
  ImportBlacklistEntry,
  UpdateAdvancedSettingsInput,
  UpdateAiSummarizationInput,
  UpdateAutomationInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import { IMPORT_BLACKLIST_KINDS } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { getDatabaseUsageReport } from "@/services/databaseUsage";
import {
  getAdvancedSettings,
  getAiSummarizationSettings,
  getAutomationSettings,
  getCustomStripParams,
  getDisplayPreferenceSettings,
  getHomepageContentSettings,
  getImportBlacklist,
  getRedirectIgnoreList,
  getShortenerIgnoreList,
  getSidebarCustomizationSettings,
  updateAdvancedSettings,
  updateAiSummarizationSettings,
  updateAutomationSettings,
  updateCustomStripParams,
  updateDisplayPreferenceSettings,
  updateHomepageContentSettings,
  updateImportBlacklist,
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
  },
} as const;

const automationBody = {
  type: "object",
  required: ["autoFetchTitle", "autoFetchImage", "autoApplyTitleTags", "sidebarOpenModifier"],
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
    sidebarOpenModifier: {
      type: "string",
      enum: ["alt", "ctrl", "shift", "meta"],
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
}
