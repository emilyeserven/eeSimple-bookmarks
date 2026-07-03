import type { FastifyInstance } from "fastify";
import type { CreateMediaPropertyInput, UpdateMediaPropertyInput } from "@eesimple/types";
import {
  bulkDeleteMediaProperties,
  createMediaProperty,
  deleteMediaProperty,
  DuplicateMediaPropertyError,
  listMediaProperties,
  updateMediaProperty,
} from "@/services/mediaProperties";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const mediaPropertyParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createMediaPropertyBody = {
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
  },
} as const;

const updateMediaPropertyBody = {
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
  },
} as const;

/** CRUD routes for media properties, mounted under `/api/media-properties`. */
export async function mediaPropertyRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/media-properties", "media-properties", bulkDeleteMediaProperties);

  app.get("/api/media-properties", {
    schema: {
      tags: ["media-properties"],
    },
  }, async () => listMediaProperties());

  app.post("/api/media-properties", {
    schema: {
      tags: ["media-properties"],
      body: createMediaPropertyBody,
    },
  }, async (req, reply) => {
    try {
      const mediaProperty = await createMediaProperty(req.body as CreateMediaPropertyInput);
      return reply.code(201).send(mediaProperty);
    }
    catch (err) {
      if (err instanceof DuplicateMediaPropertyError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/media-properties/:id", {
    schema: {
      tags: ["media-properties"],
      params: mediaPropertyParams,
      body: updateMediaPropertyBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const mediaProperty = await updateMediaProperty(id, req.body as UpdateMediaPropertyInput);
      if (!mediaProperty) return reply.code(404).send({
        message: "Media property not found",
      });
      return mediaProperty;
    }
    catch (err) {
      if (err instanceof DuplicateMediaPropertyError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/media-properties/:id", {
    schema: {
      tags: ["media-properties"],
      params: mediaPropertyParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteMediaProperty(id);
    if (!deleted) return reply.code(404).send({
      message: "Media property not found",
    });
    return reply.code(204).send();
  });
}
