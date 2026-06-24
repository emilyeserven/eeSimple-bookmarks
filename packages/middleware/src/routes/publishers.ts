import type { FastifyInstance } from "fastify";
import type { CreatePublisherInput, UpdatePublisherInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  bulkDeletePublishers,
  createPublisher,
  deletePublisher,
  DuplicatePublisherError,
  getPublisherBySlug,
  listPublishers,
  updatePublisher,
} from "@/services/publishers";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const publisherParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const slugParams = {
  type: "object",
  required: ["slug"],
  properties: {
    slug: {
      type: "string",
    },
  },
} as const;

const createPublisherBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    websiteId: {
      type: ["string", "null"],
      format: "uuid",
    },
  },
} as const;

const socialLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["platform", "url"],
    additionalProperties: false,
    properties: {
      platform: {
        type: "string",
        enum: SOCIAL_MEDIA_PLATFORMS,
      },
      url: {
        type: "string",
        minLength: 1,
      },
    },
  },
} as const;

const updatePublisherBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...createPublisherBody.properties,
    socialLinks: socialLinksSchema,
  },
} as const;

/** Routes for the Publishers taxonomy, mounted under `/api/publishers`. */
export async function publisherRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/publishers", "publishers", bulkDeletePublishers);

  app.get("/api/publishers", {
    schema: {
      tags: ["publishers"],
    },
  }, async () => listPublishers());

  app.get("/api/publishers/by-slug:slug", {
    schema: {
      tags: ["publishers"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const publisher = await getPublisherBySlug(slug);
    if (!publisher) return reply.code(404).send({
      message: "Publisher not found",
    });
    return publisher;
  });

  app.post("/api/publishers", {
    schema: {
      tags: ["publishers"],
      body: createPublisherBody,
    },
  }, async (req, reply) => {
    try {
      const publisher = await createPublisher(req.body as CreatePublisherInput);
      return reply.code(201).send(publisher);
    }
    catch (err) {
      if (err instanceof DuplicatePublisherError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/publishers/:id", {
    schema: {
      tags: ["publishers"],
      params: publisherParams,
      body: updatePublisherBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const publisher = await updatePublisher(id, req.body as UpdatePublisherInput);
      if (!publisher) return reply.code(404).send({
        message: "Publisher not found",
      });
      return publisher;
    }
    catch (err) {
      if (err instanceof DuplicatePublisherError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/publishers/:id", {
    schema: {
      tags: ["publishers"],
      params: publisherParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deletePublisher(id);
    if (!deleted) return reply.code(404).send({
      message: "Publisher not found",
    });
    return reply.code(204).send();
  });
}
