import type { FastifyInstance } from "fastify";
import type { CreateTrackInput, UpdateTrackInput } from "@eesimple/types";
import {
  bulkDeleteTracks,
  createTrack,
  deleteTrack,
  DuplicateTrackError,
  listTracks,
  updateTrack,
} from "@/services/tracks";
import { importPlexPosterForTaxonomy } from "@/services/plex";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerPlexMetadataPreviewRoute } from "@/routes/plexMetadataPreviewRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const trackParams = {
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
const trackDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  albumId: {
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

const createTrackBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...trackDataFields,
  },
} as const;

const updateTrackBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...trackDataFields,
  },
} as const;

/** CRUD routes for the Tracks taxonomy, mounted under `/api/tracks`. */
export async function trackRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/tracks", "tracks", bulkDeleteTracks);

  app.get("/api/tracks", {
    schema: {
      tags: ["tracks"],
    },
  }, async () => listTracks());

  app.post("/api/tracks", {
    schema: {
      tags: ["tracks"],
      body: createTrackBody,
    },
  }, async (req, reply) => {
    try {
      const track = await createTrack(req.body as CreateTrackInput);
      return reply.code(201).send(track);
    }
    catch (err) {
      if (err instanceof DuplicateTrackError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/tracks/:id", {
    schema: {
      tags: ["tracks"],
      params: trackParams,
      body: updateTrackBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const track = await updateTrack(id, req.body as UpdateTrackInput);
      if (!track) return reply.code(404).send({
        message: "Track not found",
      });
      return track;
    }
    catch (err) {
      if (err instanceof DuplicateTrackError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/tracks/:id", {
    schema: {
      tags: ["tracks"],
      params: trackParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteTrack(id);
    if (!deleted) return reply.code(404).send({
      message: "Track not found",
    });
    return reply.code(204).send();
  });

  registerTaxonomyImageRoutes(app, "/api/tracks", "track", "tracks", [
    {
      path: "plex-poster",
      run: id => importPlexPosterForTaxonomy("track", id),
      errorMessages: {
        not_linked: "Track is not linked to a Plex item",
        poster_unavailable: "Could not fetch the poster from Plex",
      },
    },
  ]);

  registerPlexMetadataPreviewRoute(app, "/api/tracks", "track", "tracks");
}
