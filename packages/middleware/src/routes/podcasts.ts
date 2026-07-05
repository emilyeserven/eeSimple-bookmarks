import type { FastifyInstance } from "fastify";
import type { CreatePodcastInput, UpdatePodcastInput } from "@eesimple/types";
import { PODCAST_LINK_PROVIDERS, PODCAST_SEARCH_PROVIDERS } from "@eesimple/types";
import {
  bulkDeletePodcasts,
  createPodcast,
  deletePodcast,
  DuplicatePodcastError,
  getPodcast,
  listPodcasts,
  updatePodcast,
} from "@/services/podcasts";
import {
  importPodcastArtwork,
  resolvePodcastByUrl,
  resolvePodcastFeedPreview,
  resolvePodcastProviderLinks,
  searchPodcasts,
  searchPodcastsPocketCasts,
} from "@/services/podcastFeed";
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
  spotifyUrl: {
    type: ["string", "null"],
  },
  pocketCastsUuid: {
    type: ["string", "null"],
  },
  pocketCastsUrl: {
    type: ["string", "null"],
  },
  defaultLinkProvider: {
    type: ["string", "null"],
    enum: [...PODCAST_LINK_PROVIDERS, null],
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
  description: {
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

  // Keyless podcast search for the create/edit picker; `provider` selects the directory (default iTunes).
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
          provider: {
            type: "string",
            enum: [...PODCAST_SEARCH_PROVIDERS],
          },
        },
      },
    },
  }, async (req) => {
    const {
      q, provider,
    } = req.query as { q: string;
      provider?: (typeof PODCAST_SEARCH_PROVIDERS)[number]; };
    return provider === "pocketCasts" ? searchPodcastsPocketCasts(q) : searchPodcasts(q);
  });

  // Resolve-only: a pasted Apple Podcasts show URL or raw RSS/XML feed URL, for the search picker's
  // "paste a URL" mode. Never writes.
  app.get("/api/podcasts/resolve-url", {
    schema: {
      tags: ["podcasts"],
      querystring: {
        type: "object",
        required: ["url"],
        properties: {
          url: {
            type: "string",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      url,
    } = req.query as { url: string };
    let parsed: URL;
    try {
      parsed = new URL(url);
    }
    catch {
      return reply.code(400).send({
        message: "Invalid URL",
      });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return reply.code(400).send({
        message: "Invalid URL",
      });
    }
    const result = await resolvePodcastByUrl(url);
    if (!result) return reply.code(404).send({
      message: "No podcast found at that URL",
    });
    return result;
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

  // Resolve-only: cross-resolve the podcast's page URL on each keyless directory from its feed URL.
  // Powers the "Find on all services" action + the search-picker select prefill. Never writes.
  app.get("/api/podcasts/:id/resolve-links", {
    schema: {
      tags: ["podcasts"],
      params: podcastParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const podcast = await getPodcast(id);
    if (!podcast) return reply.code(404).send({
      message: "Podcast not found",
    });
    if (!podcast.feedUrl) return reply.code(404).send({
      message: "Podcast has no feed URL to match against",
    });
    return resolvePodcastProviderLinks(podcast.name, podcast.feedUrl);
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
