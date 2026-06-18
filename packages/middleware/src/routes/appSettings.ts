import type { FastifyInstance } from "fastify";
import { getShortenerIgnoreList, updateShortenerIgnoreList } from "@/services/appSettings";

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
}
