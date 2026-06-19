import type { FastifyInstance } from "fastify";
import type { CreateMediaTypeInput, UpdateMediaTypeInput } from "@eesimple/types";
import {
  BuiltInMediaTypeError,
  createMediaType,
  deleteMediaType,
  DuplicateMediaTypeError,
  listMediaTypes,
  updateMediaType,
} from "@/services/mediaTypes";

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
  },
} as const;

/** Routes for the built-in Media Types taxonomy, mounted under `/api/media-types`. */
export async function mediaTypeRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/media-types", {
    schema: {
      tags: ["media-types"],
    },
  }, async () => listMediaTypes());

  app.post("/api/media-types", {
    schema: {
      tags: ["media-types"],
      body: createMediaTypeBody,
    },
  }, async (req, reply) => {
    try {
      const mediaType = await createMediaType(req.body as CreateMediaTypeInput);
      return reply.code(201).send(mediaType);
    }
    catch (err) {
      if (err instanceof DuplicateMediaTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    try {
      const mediaType = await updateMediaType(id, req.body as UpdateMediaTypeInput);
      if (!mediaType) return reply.code(404).send({
        message: "Media type not found",
      });
      return mediaType;
    }
    catch (err) {
      if (err instanceof DuplicateMediaTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInMediaTypeError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    try {
      const deleted = await deleteMediaType(id);
      if (!deleted) return reply.code(404).send({
        message: "Media type not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInMediaTypeError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
