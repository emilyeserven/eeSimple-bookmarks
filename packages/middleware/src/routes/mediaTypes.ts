import type { FastifyInstance } from "fastify";
import type { CreateMediaTypeInput, UpdateMediaTypeInput } from "@eesimple/types";
import {
  bulkDeleteMediaTypes,
  createMediaType,
  deleteMediaType,
  getMediaTypeTree,
  listMediaTypes,
  updateMediaType,
} from "@/services/mediaTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

const mediaTypeParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createMediaTypeBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
    icon: {
      type: "string",
      nullable: true,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

const updateMediaTypeBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
    icon: {
      type: "string",
      nullable: true,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

/** Routes for the built-in Media Types taxonomy, mounted under `/api/media-types`. */
export async function mediaTypeRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/media-types", "media-types", bulkDeleteMediaTypes);

  app.get("/api/media-types", {
    schema: {
      tags: ["media-types"],
    },
  }, async () => listMediaTypes());

  app.get("/api/media-types/tree", {
    schema: {
      tags: ["media-types"],
    },
  }, async () => getMediaTypeTree());

  app.post("/api/media-types", {
    schema: {
      tags: ["media-types"],
      body: createMediaTypeBody,
    },
  }, async (req, reply) => {
    const mediaType = await createMediaType(req.body as CreateMediaTypeInput);
    return reply.code(201).send(mediaType);
  });

  app.patch("/api/media-types/:id", {
    schema: {
      tags: ["media-types"],
      params: mediaTypeParams,
      body: updateMediaTypeBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const mediaType = await updateMediaType(id, req.body as UpdateMediaTypeInput);
    if (!mediaType) throw new NotFoundError("Media type");
    return mediaType;
  });

  app.delete("/api/media-types/:id", {
    schema: {
      tags: ["media-types"],
      params: mediaTypeParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteMediaType(id);
    if (!deleted) throw new NotFoundError("Media type");
    return reply.code(204).send();
  });
}
