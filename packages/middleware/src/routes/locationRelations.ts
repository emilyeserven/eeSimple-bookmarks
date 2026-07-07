import type { FastifyInstance } from "fastify";
import type { CreateLocationRelationInput, UpdateLocationRelationInput } from "@eesimple/types";
import {
  bulkDeleteLocationRelations,
  createLocationRelation,
  deleteLocationRelation,
  listLocationRelations,
  updateLocationRelation,
} from "@/services/locationRelations";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

const locationRelationParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const deleteLocationRelationQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    reassignTo: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createLocationRelationBody = {
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

const updateLocationRelationBody = {
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

/** Routes for the Location Relations vocabulary, mounted under `/api/location-relations`. */
export async function locationRelationRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/location-relations", "location-relations", bulkDeleteLocationRelations);

  app.get("/api/location-relations", {
    schema: {
      tags: ["location-relations"],
    },
  }, async () => listLocationRelations());

  app.post("/api/location-relations", {
    schema: {
      tags: ["location-relations"],
      body: createLocationRelationBody,
    },
  }, async (req, reply) => {
    const relation = await createLocationRelation(req.body as CreateLocationRelationInput);
    return reply.code(201).send(relation);
  });

  app.patch("/api/location-relations/:id", {
    schema: {
      tags: ["location-relations"],
      params: locationRelationParams,
      body: updateLocationRelationBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const relation = await updateLocationRelation(id, req.body as UpdateLocationRelationInput);
    if (!relation) throw new NotFoundError("Location relation");
    return relation;
  });

  app.delete("/api/location-relations/:id", {
    schema: {
      tags: ["location-relations"],
      params: locationRelationParams,
      querystring: deleteLocationRelationQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      reassignTo,
    } = req.query as { reassignTo?: string };
    const deleted = await deleteLocationRelation(id, reassignTo);
    if (!deleted) throw new NotFoundError("Location relation");
    return reply.code(204).send();
  });
}
