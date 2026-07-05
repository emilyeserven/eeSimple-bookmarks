import type { FastifyInstance } from "fastify";
import type { PlexSearchKind } from "@/services/plex";
import { fetchPlexPoster, plexEnabledAsync, searchPlexItems } from "@/services/plex";
import { AppError, NotFoundError } from "@/utils/errors";

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

const ratingKeyQuery = {
  type: "object",
  required: ["ratingKey"],
  additionalProperties: false,
  properties: {
    ratingKey: {
      type: "string",
      minLength: 1,
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
      throw new AppError("Plex is not configured", "storageUnconfigured", 503);
    }
    const {
      q, kind,
    } = req.query as { q: string;
      kind?: PlexSearchKind; };
    return searchPlexItems(q, kind);
  });

  // Proxy a linked Plex item's poster image bytes so the client can preview the NEW source image
  // before applying it. Token-gated → the bytes are streamed through the middleware, never the URL.
  app.get("/api/plex/poster", {
    schema: {
      tags: ["connectors"],
      querystring: ratingKeyQuery,
    },
  }, async (req, reply) => {
    if (!(await plexEnabledAsync())) {
      throw new AppError("Plex is not configured", "storageUnconfigured", 503);
    }
    const {
      ratingKey,
    } = req.query as { ratingKey: string };
    const bytes = await fetchPlexPoster(ratingKey);
    if (!bytes) {
      throw new NotFoundError("Poster", "No poster");
    }
    reply.header("Content-Type", "image/jpeg");
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(bytes);
  });
}
