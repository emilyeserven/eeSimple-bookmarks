import type { FastifyInstance } from "fastify";
import type { CreatePlaceTypeInput, UpdatePlaceTypeInput } from "@eesimple/types";
import {
  bulkDeletePlaceTypes,
  createPlaceType,
  deletePlaceType,
  DuplicatePlaceTypeError,
  listPlaceTypes,
  updatePlaceType,
} from "@/services/placeTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const placeTypeParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createPlaceTypeBody = {
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

const updatePlaceTypeBody = {
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

/** Routes for the Place Types vocabulary, mounted under `/api/place-types`. */
export async function placeTypeRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/place-types", "place-types", bulkDeletePlaceTypes);

  app.get("/api/place-types", {
    schema: {
      tags: ["place-types"],
    },
  }, async () => listPlaceTypes());

  app.post("/api/place-types", {
    schema: {
      tags: ["place-types"],
      body: createPlaceTypeBody,
    },
  }, async (req, reply) => {
    try {
      const placeType = await createPlaceType(req.body as CreatePlaceTypeInput);
      return reply.code(201).send(placeType);
    }
    catch (err) {
      if (err instanceof DuplicatePlaceTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/place-types/:id", {
    schema: {
      tags: ["place-types"],
      params: placeTypeParams,
      body: updatePlaceTypeBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const placeType = await updatePlaceType(id, req.body as UpdatePlaceTypeInput);
      if (!placeType) return reply.code(404).send({
        message: "Place type not found",
      });
      return placeType;
    }
    catch (err) {
      if (err instanceof DuplicatePlaceTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/place-types/:id", {
    schema: {
      tags: ["place-types"],
      params: placeTypeParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deletePlaceType(id);
    if (!deleted) return reply.code(404).send({
      message: "Place type not found",
    });
    return reply.code(204).send();
  });
}
