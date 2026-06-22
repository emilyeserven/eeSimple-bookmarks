import type { UpdateAdvancedSettingsInput, UpdateHomepageContentInput } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import {
  getAdvancedSettings,
  getHomepageContentSettings,
  getShortenerIgnoreList,
  updateAdvancedSettings,
  updateHomepageContentSettings,
  updateShortenerIgnoreList,
} from "@/services/appSettings";

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
}
