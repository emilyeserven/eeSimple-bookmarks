import type { FastifyInstance } from "fastify";
import type {
  CreateRelationshipTypeInput,
  UpdateRelationshipTypeInput,
} from "@eesimple/types";
import {
  bulkDeleteRelationshipTypes,
  BuiltInRelationshipTypeError,
  createRelationshipType,
  deleteRelationshipType,
  DuplicateRelationshipTypeError,
  listRelationshipTypes,
  updateRelationshipType,
} from "@/services/relationshipTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const relationshipTypeParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createRelationshipTypeBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    directional: {
      type: "boolean",
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const updateRelationshipTypeBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    directional: {
      type: "boolean",
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

/** Routes for the "Relationship Types" taxonomy, mounted under `/api/relationship-types`. */
export async function relationshipTypeRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(
    app,
    "/api/relationship-types",
    "relationship-types",
    bulkDeleteRelationshipTypes,
  );

  app.get("/api/relationship-types", {
    schema: {
      tags: ["relationship-types"],
    },
  }, async () => listRelationshipTypes());

  app.post("/api/relationship-types", {
    schema: {
      tags: ["relationship-types"],
      body: createRelationshipTypeBody,
    },
  }, async (req, reply) => {
    try {
      const relationshipType = await createRelationshipType(
        req.body as CreateRelationshipTypeInput,
      );
      return reply.code(201).send(relationshipType);
    }
    catch (err) {
      if (err instanceof DuplicateRelationshipTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/relationship-types/:id", {
    schema: {
      tags: ["relationship-types"],
      params: relationshipTypeParams,
      body: updateRelationshipTypeBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const relationshipType = await updateRelationshipType(
        id,
        req.body as UpdateRelationshipTypeInput,
      );
      if (!relationshipType) return reply.code(404).send({
        message: "Relationship type not found",
      });
      return relationshipType;
    }
    catch (err) {
      if (err instanceof DuplicateRelationshipTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInRelationshipTypeError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/relationship-types/:id", {
    schema: {
      tags: ["relationship-types"],
      params: relationshipTypeParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const deleted = await deleteRelationshipType(id);
      if (!deleted) return reply.code(404).send({
        message: "Relationship type not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInRelationshipTypeError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
