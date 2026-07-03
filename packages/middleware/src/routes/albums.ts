import type { FastifyInstance } from "fastify";
import type { CreateAlbumInput, UpdateAlbumInput } from "@eesimple/types";
import {
  bulkDeleteAlbums,
  createAlbum,
  deleteAlbum,
  DuplicateAlbumError,
  listAlbums,
  updateAlbum,
} from "@/services/albums";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexAutofetchRoute } from "@/routes/plexAutofetchRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const albumParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Plex/media-property + artists data fields shared by the create and update bodies. */
const albumDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  artistIds: {
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

const createAlbumBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...albumDataFields,
  },
} as const;

const updateAlbumBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...albumDataFields,
  },
} as const;

/** CRUD routes for the Albums taxonomy, mounted under `/api/albums`. */
export async function albumRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/albums", "albums", bulkDeleteAlbums);

  app.get("/api/albums", {
    schema: {
      tags: ["albums"],
    },
  }, async () => listAlbums());

  app.post("/api/albums", {
    schema: {
      tags: ["albums"],
      body: createAlbumBody,
    },
  }, async (req, reply) => {
    try {
      const album = await createAlbum(req.body as CreateAlbumInput);
      return reply.code(201).send(album);
    }
    catch (err) {
      if (err instanceof DuplicateAlbumError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/albums/:id", {
    schema: {
      tags: ["albums"],
      params: albumParams,
      body: updateAlbumBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const album = await updateAlbum(id, req.body as UpdateAlbumInput);
      if (!album) return reply.code(404).send({
        message: "Album not found",
      });
      return album;
    }
    catch (err) {
      if (err instanceof DuplicateAlbumError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/albums/:id", {
    schema: {
      tags: ["albums"],
      params: albumParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteAlbum(id);
    if (!deleted) return reply.code(404).send({
      message: "Album not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/albums", "album", "albums", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("album", id),
      errorMessages: {
        not_linked: "Album is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);

  registerPlexAutofetchRoute(app, "/api/albums", "album", "albums");
}
