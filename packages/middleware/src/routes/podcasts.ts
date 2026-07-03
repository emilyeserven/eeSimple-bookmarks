import type { FastifyInstance } from "fastify";
import type { CreatePodcastInput, UpdatePodcastInput } from "@eesimple/types";
import {
  bulkDeletePodcasts,
  createPodcast,
  deletePodcast,
  DuplicatePodcastError,
  listPodcasts,
  updatePodcast,
} from "@/services/podcasts";
import { importPodcastArtwork, resolvePodcastFeedPreview, searchPodcasts } from "@/services/podcastFeed";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { registerTaxonomyImageRoutes } from "@/routes/taxonomyImageRoutes";

const podcastParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Source/media-property data fields shared by the create and update bodies. */
const podcastDataFields = {
  sortOrder: {
    type: "integer",
  },
  mediaPropertyId: {
    type: ["string", "null"],
    format: "uuid",
  },
  feedUrl: {
    type: ["string", "null"],
  },
  itunesId: {
    type: ["integer", "null"],
  },
  itunesUrl: {
    type: ["string", "null"],
  },
  author: {
    type: ["string", "null"],
  },
  description: {
    type: ["string", "null"],
  },
  romanizedName: {
    type: ["string", "null"],
  },
} as const;

const createPodcastBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...podcastDataFields,
  },
} as const;

const updatePodcastBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    ...podcastDataFields,
  },
} as const;

/** CRUD + keyless-connector routes for the Podcasts taxonomy, mounted under `/api/podcasts`. */
export async function podcastRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/podcasts", "podcasts", bulkDeletePodcasts);

  app.get("/api/podcasts", {
    schema: {
      tags: ["podcasts"],
    },
  }, async () => listPodcasts());

  // Keyless Apple Podcasts (iTunes) search for the create/edit picker.
  app.get("/api/podcasts/search", {
    schema: {
      tags: ["podcasts"],
      querystring: {
        type: "object",
        required: ["q"],
        properties: {
          q: {
            type: "string",
          },
        },
      },
    },
  }, async (req) => {
    const {
      q,
    } = req.query as { q: string };
    return searchPodcasts(q);
  });

  app.post("/api/podcasts", {
    schema: {
      tags: ["podcasts"],
      body: createPodcastBody,
    },
  }, async (req, reply) => {
    try {
      const podcast = await createPodcast(req.body as CreatePodcastInput);
      return reply.code(201).send(podcast);
    }
    catch (err) {
      if (err instanceof DuplicatePodcastError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/podcasts/:id", {
    schema: {
      tags: ["podcasts"],
      params: podcastParams,
      body: updatePodcastBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const podcast = await updatePodcast(id, req.body as UpdatePodcastInput);
      if (!podcast) return reply.code(404).send({
        message: "Podcast not found",
      });
      return podcast;
    }
    catch (err) {
      if (err instanceof DuplicatePodcastError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/podcasts/:id", {
    schema: {
      tags: ["podcasts"],
      params: podcastParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deletePodcast(id);
    if (!deleted) return reply.code(404).send({
      message: "Podcast not found",
    });
    return reply.code(204).send();
  });

  // Resolve-only preview of the podcast's current source metadata (RSS feed / iTunes). Never writes —
  // powers the "Sync from source" current-vs-source review modal.
  app.get("/api/podcasts/:id/feed-preview", {
    schema: {
      tags: ["podcasts"],
      params: podcastParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const result = await resolvePodcastFeedPreview(id);
    if (!result) return reply.code(404).send({
      message: "No podcast source could be resolved",
    });
    return result;
  });

  registerTaxonomyImageRoutes(app, "/api/podcasts", "podcast", "podcasts", [
    {
      path: "artwork",
      run: importPodcastArtwork,
      errorMessages: {
        no_source: "Podcast has no feed URL or iTunes link on file",
        artwork_unavailable: "Could not fetch artwork from the podcast source",
      },
    },
  ]);
}
