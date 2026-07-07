import type { FastifyInstance } from "fastify";
import type { CreatePropertyGroupInput, UpdatePropertyGroupInput } from "@eesimple/types";
import {
  bulkDeletePropertyGroups,
  createPropertyGroup,
  deletePropertyGroup,
  listPropertyGroups,
  updatePropertyGroup,
} from "@/services/propertyGroups";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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

const uuidArray = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
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
    categoryIds: uuidArray,
    allCategories: {
      type: "boolean",
    },
    mediaTypeIds: uuidArray,
    allMediaTypes: {
      type: "boolean",
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
    categoryIds: uuidArray,
    allCategories: {
      type: "boolean",
    },
    mediaTypeIds: uuidArray,
    allMediaTypes: {
      type: "boolean",
    },
  },
} as const;

/** CRUD routes for property groups, mounted under `/api/property-groups`. */
export async function propertyGroupRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/property-groups", "property-groups", bulkDeletePropertyGroups);

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
    const group = await createPropertyGroup(req.body as CreatePropertyGroupInput);
    return reply.code(201).send(group);
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
    const group = await updatePropertyGroup(id, req.body as UpdatePropertyGroupInput);
    if (!group) throw new NotFoundError("Property group");
    return group;
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
    if (!deleted) throw new NotFoundError("Property group");
    return reply.code(204).send();
  });
}
