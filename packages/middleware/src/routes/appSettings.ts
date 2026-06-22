import type {
  UpdateAdvancedSettingsInput,
  UpdateAutomationInput,
  UpdateDisplayPreferenceInput,
  UpdateHomepageContentInput,
  UpdateSidebarCustomizationInput,
} from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import {
  getAdvancedSettings,
  getAutomationSettings,
  getDisplayPreferenceSettings,
  getHomepageContentSettings,
  getShortenerIgnoreList,
  getSidebarCustomizationSettings,
  updateAdvancedSettings,
  updateAutomationSettings,
  updateDisplayPreferenceSettings,
  updateHomepageContentSettings,
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
    "hiddenTaxonomyItems",
    "hiddenCustomizationItems",
    "hiddenManagementItems",
    "hiddenSidebarGroups",
  ],
  additionalProperties: false,
  properties: {
    hiddenCategoryIds: stringArray,
    hiddenTaxonomyItems: stringArray,
    hiddenCustomizationItems: stringArray,
    hiddenManagementItems: stringArray,
    hiddenSidebarGroups: stringArray,
  },
} as const;

const automationBody = {
  type: "object",
  required: ["autoFetchTitle", "autoFetchImage", "sidebarOpenModifier"],
  additionalProperties: false,
  properties: {
    autoFetchTitle: {
      type: "boolean",
    },
    autoFetchImage: {
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
}
