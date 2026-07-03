import type { FastifyInstance } from "fastify";
import type { PlexSearchKind } from "@/services/plex";
import { plexEnabledAsync, searchPlexItems } from "@/services/plex";

const searchQuery = {
  type: "object",
  required: ["q"],
  additionalProperties: false,
  properties: {
    q: {
      type: "string",
      minLength: 1,
    },
    // Optional: narrow the results to a single media family for the taxonomy lookups.
    kind: {
      type: "string",
      enum: ["movie", "show", "episode", "album", "artist", "track"],
    },
  },
} as const;

/**
 * Plex lookups, mounted under `/api`. The middleware proxies the operator's Plex server so the
 * `X-Plex-Token` never reaches the client — responses carry only the mapped item DTOs.
 */
export async function plexRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/plex/search", {
    schema: {
      tags: ["connectors"],
      querystring: searchQuery,
    },
  }, async (req, reply) => {
    if (!(await plexEnabledAsync())) {
      return reply.code(503).send({
        message: "Plex is not configured",
      });
    }
    const {
      q, kind,
    } = req.query as { q: string;
      kind?: PlexSearchKind; };
    return searchPlexItems(q, kind);
  });
}
