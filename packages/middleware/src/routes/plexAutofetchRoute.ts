import type { FastifyInstance } from "fastify";
import {
  autofetchPlexTaxonomyMetadata,
  plexEnabledAsync,
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
 * Register the shared `POST ${basePath}/:id/plex-autofetch` action for one Plex-backed media taxonomy.
 * One click imports the linked Plex item's poster and resolves its Wikidata item (via the item's
 * external IDs, falling back to a title search) to overwrite the native/romanized names + Wikipedia
 * links. Gated on the Plex connector being configured; the poster half additionally no-ops without
 * object storage. Returns the {@link autofetchPlexTaxonomyMetadata} result (including the possibly
 * renamed slug) so the client can follow a rename.
 */
export function registerPlexAutofetchRoute(
  app: FastifyInstance,
  basePath: string,
  ownerType: PlexTaxonomyOwnerType,
  tag: string,
): void {
  app.post(`${basePath}/:id/plex-autofetch`, {
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
    const result = await autofetchPlexTaxonomyMetadata(ownerType, id);
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
