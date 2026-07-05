import type { FastifyInstance } from "fastify";
import type { CreateEpisodeInput, UpdateEpisodeInput } from "@eesimple/types";
import {
  bulkDeleteEpisodes,
  createEpisode,
  deleteEpisode,
  DuplicateEpisodeError,
  listEpisodes,
  updateEpisode,
} from "@/services/episodes";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexMetadataPreviewRoute } from "@/routes/plexMetadataPreviewRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const episodeParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Plex/media-property/parent data fields shared by the create and update bodies. */
const episodeDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  tvShowId: {
    type: ["string", "null"],
    format: "uuid",
  },
  plexRatingKey: {
    type: ["string", "null"],
  },
  plexItemType: {
    type: ["string", "null"],
  },
  plexItemTitle: {
    type: ["string", "null"],
  },
  year: {
    type: ["integer", "null"],
  },
  wikidataId: {
    type: ["string", "null"],
  },
  wikipediaLinkEn: {
    type: ["string", "null"],
  },
  wikipediaLinkLocal: {
    type: ["string", "null"],
  },
} as const;

const createEpisodeBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...episodeDataFields,
  },
} as const;

const updateEpisodeBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...episodeDataFields,
  },
} as const;

/** CRUD routes for the Episodes taxonomy, mounted under `/api/episodes`. */
export async function episodeRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/episodes", "episodes", bulkDeleteEpisodes);

  app.get("/api/episodes", {
    schema: {
      tags: ["episodes"],
    },
  }, async () => listEpisodes());

  app.post("/api/episodes", {
    schema: {
      tags: ["episodes"],
      body: createEpisodeBody,
    },
  }, async (req, reply) => {
    try {
      const episode = await createEpisode(req.body as CreateEpisodeInput);
      return reply.code(201).send(episode);
    }
    catch (err) {
      if (err instanceof DuplicateEpisodeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/episodes/:id", {
    schema: {
      tags: ["episodes"],
      params: episodeParams,
      body: updateEpisodeBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const episode = await updateEpisode(id, req.body as UpdateEpisodeInput);
      if (!episode) return reply.code(404).send({
        message: "Episode not found",
      });
      return episode;
    }
    catch (err) {
      if (err instanceof DuplicateEpisodeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/episodes/:id", {
    schema: {
      tags: ["episodes"],
      params: episodeParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteEpisode(id);
    if (!deleted) return reply.code(404).send({
      message: "Episode not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/episodes", "episode", "episodes", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("episode", id),
      errorMessages: {
        not_linked: "Episode is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);

  registerPlexMetadataPreviewRoute(app, "/api/episodes", "episode", "episodes");
}
