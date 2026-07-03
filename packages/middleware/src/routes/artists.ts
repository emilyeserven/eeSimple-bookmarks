import type { FastifyInstance } from "fastify";
import type { CreateArtistInput, UpdateArtistInput } from "@eesimple/types";
import {
  bulkDeleteArtists,
  createArtist,
  deleteArtist,
  DuplicateArtistError,
  listArtists,
  updateArtist,
} from "@/services/artists";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexAutofetchRoute } from "@/routes/plexAutofetchRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const artistParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Plex/media-property + albums data fields shared by the create and update bodies. */
const artistDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  albumIds: {
    type: "array",
    items: {
      type: "string",
      format: "uuid",
    },
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

const createArtistBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...artistDataFields,
  },
} as const;

const updateArtistBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...artistDataFields,
  },
} as const;

/** CRUD routes for the Artists taxonomy, mounted under `/api/artists`. */
export async function artistRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/artists", "artists", bulkDeleteArtists);

  app.get("/api/artists", {
    schema: {
      tags: ["artists"],
    },
  }, async () => listArtists());

  app.post("/api/artists", {
    schema: {
      tags: ["artists"],
      body: createArtistBody,
    },
  }, async (req, reply) => {
    try {
      const artist = await createArtist(req.body as CreateArtistInput);
      return reply.code(201).send(artist);
    }
    catch (err) {
      if (err instanceof DuplicateArtistError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/artists/:id", {
    schema: {
      tags: ["artists"],
      params: artistParams,
      body: updateArtistBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const artist = await updateArtist(id, req.body as UpdateArtistInput);
      if (!artist) return reply.code(404).send({
        message: "Artist not found",
      });
      return artist;
    }
    catch (err) {
      if (err instanceof DuplicateArtistError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/artists/:id", {
    schema: {
      tags: ["artists"],
      params: artistParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteArtist(id);
    if (!deleted) return reply.code(404).send({
      message: "Artist not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/artists", "artist", "artists", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("artist", id),
      errorMessages: {
        not_linked: "Artist is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);

  registerPlexAutofetchRoute(app, "/api/artists", "artist", "artists");
}
