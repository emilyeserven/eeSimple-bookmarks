import type { FastifyInstance } from "fastify";
import type { CreateTvShowInput, UpdateTvShowInput } from "@eesimple/types";
import {
  bulkDeleteTvShows,
  createTvShow,
  deleteTvShow,
  DuplicateTvShowError,
  listTvShows,
  updateTvShow,
} from "@/services/tvShows";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const tvShowParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Plex/media-property data fields shared by the create and update bodies. */
const tvShowDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
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
  romanizedName: {
    type: ["string", "null"],
  },
} as const;

const createTvShowBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...tvShowDataFields,
  },
} as const;

const updateTvShowBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...tvShowDataFields,
  },
} as const;

/** CRUD routes for the TV Shows taxonomy, mounted under `/api/tv-shows`. */
export async function tvShowRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/tv-shows", "tv-shows", bulkDeleteTvShows);

  app.get("/api/tv-shows", {
    schema: {
      tags: ["tv-shows"],
    },
  }, async () => listTvShows());

  app.post("/api/tv-shows", {
    schema: {
      tags: ["tv-shows"],
      body: createTvShowBody,
    },
  }, async (req, reply) => {
    try {
      const show = await createTvShow(req.body as CreateTvShowInput);
      return reply.code(201).send(show);
    }
    catch (err) {
      if (err instanceof DuplicateTvShowError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/tv-shows/:id", {
    schema: {
      tags: ["tv-shows"],
      params: tvShowParams,
      body: updateTvShowBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const show = await updateTvShow(id, req.body as UpdateTvShowInput);
      if (!show) return reply.code(404).send({
        message: "TV show not found",
      });
      return show;
    }
    catch (err) {
      if (err instanceof DuplicateTvShowError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/tv-shows/:id", {
    schema: {
      tags: ["tv-shows"],
      params: tvShowParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteTvShow(id);
    if (!deleted) return reply.code(404).send({
      message: "TV show not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/tv-shows", "tvShow", "tv-shows", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("tvShow", id),
      errorMessages: {
        not_linked: "TV show is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);
}
