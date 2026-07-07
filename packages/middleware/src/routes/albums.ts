import type { FastifyInstance } from "fastify";
import type { CreateAlbumInput, UpdateAlbumInput } from "@eesimple/types";
import {
  bulkDeleteAlbums,
  createAlbum,
  deleteAlbum,
  listAlbums,
  updateAlbum,
} from "@/services/albums";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { NotFoundError } from "@/utils/errors";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexMetadataPreviewRoute } from "@/routes/plexMetadataPreviewRoute";
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

/** Plex/media-property + People/Group credit fields shared by the create and update bodies. */
const albumDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  personIds: {
    type: "array",
    items: {
      type: "string",
      format: "uuid",
    },
  },
  groupIds: {
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
    labeledWebsites: labeledWebsitesSchema,
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
    const album = await createAlbum(req.body as CreateAlbumInput);
    return reply.code(201).send(album);
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
    const album = await updateAlbum(id, req.body as UpdateAlbumInput);
    if (!album) throw new NotFoundError("Album");
    return album;
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
    if (!deleted) throw new NotFoundError("Album");
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

  registerPlexMetadataPreviewRoute(app, "/api/albums", "album", "albums");
}
