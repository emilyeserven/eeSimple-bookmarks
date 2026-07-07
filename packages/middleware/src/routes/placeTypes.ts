import type { FastifyInstance } from "fastify";
import type { CreatePlaceTypeInput, UpdatePlaceTypeInput } from "@eesimple/types";
import {
  bulkDeletePlaceTypes,
  createPlaceType,
  deletePlaceType,
  listPlaceTypes,
  updatePlaceType,
} from "@/services/placeTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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

const deletePlaceTypeQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    reassignTo: {
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
    description: {
      type: ["string", "null"],
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
    description: {
      type: ["string", "null"],
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
    const placeType = await createPlaceType(req.body as CreatePlaceTypeInput);
    return reply.code(201).send(placeType);
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
    const placeType = await updatePlaceType(id, req.body as UpdatePlaceTypeInput);
    if (!placeType) throw new NotFoundError("Place type");
    return placeType;
  });

  app.delete("/api/place-types/:id", {
    schema: {
      tags: ["place-types"],
      params: placeTypeParams,
      querystring: deletePlaceTypeQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      reassignTo,
    } = req.query as { reassignTo?: string };
    const deleted = await deletePlaceType(id, reassignTo);
    if (!deleted) throw new NotFoundError("Place type");
    return reply.code(204).send();
  });
}
