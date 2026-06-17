import type { FastifyInstance } from "fastify";
import { fetchPageTitle } from "@/services/metadata";
import { isValidUrl } from "@/utils/url";

const fetchTitleQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
  },
} as const;

/** Metadata helpers (page-title lookup), mounted under `/api`. */
export async function metadataRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/fetch-title", {
    schema: {
      tags: ["metadata"],
      querystring: fetchTitleQuery,
    },
  }, async (req, reply) => {
    const {
      url,
    } = req.query as { url: string };
    if (!isValidUrl(url)) {
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
    }
    const title = await fetchPageTitle(url);
    if (title === null) {
      return reply.code(502).send({
        message: "Could not fetch a title for that URL",
      });
    }
    return {
      title,
    };
  });
}
