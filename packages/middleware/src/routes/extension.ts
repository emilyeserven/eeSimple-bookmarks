import type { FastifyInstance } from "fastify";
import { getExtensionFillContext } from "@/services/extensionFill";
import { ValidationError } from "@/utils/errors";

const fillContextQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/**
 * Strictly read-only routes backing the browser extension's popup (part of #1239): no writes, no
 * `invalidateBookmarkCache()`, no scan-cache interaction.
 */
export async function extensionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/extension/fill-context", {
    schema: {
      tags: ["extension"],
      querystring: fillContextQuery,
    },
  }, async (req) => {
    const {
      url,
    } = req.query as { url: string };
    if (!url.trim()) throw new ValidationError("url is required");
    return getExtensionFillContext(url);
  });
}
