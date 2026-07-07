import type { FastifyInstance } from "fastify";
import type { CreateMovieInput, UpdateMovieInput } from "@eesimple/types";
import {
  bulkDeleteMovies,
  createMovie,
  deleteMovie,
  listMovies,
  updateMovie,
} from "@/services/movies";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { NotFoundError } from "@/utils/errors";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexMetadataPreviewRoute } from "@/routes/plexMetadataPreviewRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const movieParams = {
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
const movieDataFields = {
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

const createMovieBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...movieDataFields,
  },
} as const;

const updateMovieBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...movieDataFields,
    labeledWebsites: labeledWebsitesSchema,
  },
} as const;

/** CRUD routes for the Movies taxonomy, mounted under `/api/movies`. */
export async function movieRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/movies", "movies", bulkDeleteMovies);

  app.get("/api/movies", {
    schema: {
      tags: ["movies"],
    },
  }, async () => listMovies());

  app.post("/api/movies", {
    schema: {
      tags: ["movies"],
      body: createMovieBody,
    },
  }, async (req, reply) => {
    const movie = await createMovie(req.body as CreateMovieInput);
    return reply.code(201).send(movie);
  });

  app.patch("/api/movies/:id", {
    schema: {
      tags: ["movies"],
      params: movieParams,
      body: updateMovieBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const movie = await updateMovie(id, req.body as UpdateMovieInput);
    if (!movie) throw new NotFoundError("Movie");
    return movie;
  });

  app.delete("/api/movies/:id", {
    schema: {
      tags: ["movies"],
      params: movieParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteMovie(id);
    if (!deleted) throw new NotFoundError("Movie");
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/movies", "movie", "movies", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("movie", id),
      errorMessages: {
        not_linked: "Movie is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);

  registerPlexMetadataPreviewRoute(app, "/api/movies", "movie", "movies");
}
