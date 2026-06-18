import type { FastifyInstance } from "fastify";
import type { CreatePropertyGroupInput, UpdatePropertyGroupInput } from "@eesimple/types";
import {
  createPropertyGroup,
  deletePropertyGroup,
  DuplicatePropertyGroupError,
  listPropertyGroups,
  updatePropertyGroup,
} from "@/services/propertyGroups";

const propertyGroupParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createPropertyGroupBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    priority: {
      type: "integer",
    },
  },
} as const;

const updatePropertyGroupBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    priority: {
      type: "integer",
    },
  },
} as const;

/** CRUD routes for property groups, mounted under `/api/property-groups`. */
export async function propertyGroupRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/property-groups", {
    schema: {
      tags: ["property-groups"],
    },
  }, async () => listPropertyGroups());

  app.post("/api/property-groups", {
    schema: {
      tags: ["property-groups"],
      body: createPropertyGroupBody,
    },
  }, async (req, reply) => {
    try {
      const group = await createPropertyGroup(req.body as CreatePropertyGroupInput);
      return reply.code(201).send(group);
    }
    catch (err) {
      if (err instanceof DuplicatePropertyGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/property-groups/:id", {
    schema: {
      tags: ["property-groups"],
      params: propertyGroupParams,
      body: updatePropertyGroupBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const group = await updatePropertyGroup(id, req.body as UpdatePropertyGroupInput);
      if (!group) return reply.code(404).send({
        message: "Property group not found",
      });
      return group;
    }
    catch (err) {
      if (err instanceof DuplicatePropertyGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/property-groups/:id", {
    schema: {
      tags: ["property-groups"],
      params: propertyGroupParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deletePropertyGroup(id);
    if (!deleted) return reply.code(404).send({
      message: "Property group not found",
    });
    return reply.code(204).send();
  });
}
