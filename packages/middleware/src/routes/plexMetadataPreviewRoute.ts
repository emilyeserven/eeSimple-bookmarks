import type { FastifyInstance } from "fastify";
import {
  plexEnabledAsync,
  resolvePlexTaxonomyMetadata,
  type PlexTaxonomyOwnerType,
} from "@/services/plex";

const ownerParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/**
 * Register the shared `GET ${basePath}/:id/plex-metadata-preview` action for one Plex-backed media
 * taxonomy — the source side of the "Sync from source" review. It resolves the linked item's Wikidata
 * metadata (native name, romanized name, Wikipedia links) via the Plex item's external IDs (title-search
 * fallback) **without applying**; the client's edit form persists the rows the user picks. Gated on the
 * Plex connector being configured.
 */
export function registerPlexMetadataPreviewRoute(
  app: FastifyInstance,
  basePath: string,
  ownerType: PlexTaxonomyOwnerType,
  tag: string,
): void {
  app.get(`${basePath}/:id/plex-metadata-preview`, {
    schema: {
      tags: [tag],
      params: ownerParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!(await plexEnabledAsync())) {
      return reply.code(503).send({
        message: "Plex is not configured",
      });
    }
    const result = await resolvePlexTaxonomyMetadata(ownerType, id);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Not found",
      });
    }
    if (result === "not_linked") {
      return reply.code(400).send({
        message: "This item is not linked to a Plex item",
      });
    }
    return reply.code(200).send(result);
  });
}
