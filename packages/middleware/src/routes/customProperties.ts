import type { FastifyInstance } from "fastify";
import type {
  CreateCustomPropertyInput,
  CreateCustomPropertyTagInput,
  UpdateCustomPropertyInput,
  UpdateCustomPropertyTagInput,
} from "@eesimple/types";
import {
  createCustomProperty,
  createPropertyTag,
  deleteCustomProperty,
  deletePropertyTag,
  getPropertyTagTree,
  listCustomProperties,
  updateCustomProperty,
  updatePropertyTag,
} from "@/services/customProperties";
import { TagCycleError } from "@/services/tags";

const propertyParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const propertyTagParams = {
  type: "object",
  required: ["id", "tagId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    tagId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createPropertyBody = {
  type: "object",
  required: ["name", "type"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    type: {
      type: "string",
      enum: ["tiered_tags", "number"],
    },
    numberMin: {
      type: ["number", "null"],
    },
    numberMax: {
      type: ["number", "null"],
    },
    categoryIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

const updatePropertyBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: createPropertyBody.properties.name,
    numberMin: createPropertyBody.properties.numberMin,
    numberMax: createPropertyBody.properties.numberMax,
    categoryIds: createPropertyBody.properties.categoryIds,
  },
} as const;

const createPropertyTagBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    parentId: {
      type: ["string", "null"],
      format: "uuid",
    },
  },
} as const;

const updatePropertyTagBody = {
  type: "object",
  additionalProperties: false,
  properties: createPropertyTagBody.properties,
} as const;

/** CRUD routes for custom properties and their tier trees, under `/api/custom-properties`. */
export async function customPropertyRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/custom-properties", {
    schema: {
      tags: ["custom-properties"],
    },
  }, async () => listCustomProperties());

  app.post("/api/custom-properties", {
    schema: {
      tags: ["custom-properties"],
      body: createPropertyBody,
    },
  }, async (req, reply) => {
    const property = await createCustomProperty(req.body as CreateCustomPropertyInput);
    return reply.code(201).send(property);
  });

  app.patch("/api/custom-properties/:id", {
    schema: {
      tags: ["custom-properties"],
      params: propertyParams,
      body: updatePropertyBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const property = await updateCustomProperty(id, req.body as UpdateCustomPropertyInput);
    if (!property) return reply.code(404).send({
      message: "Custom property not found",
    });
    return property;
  });

  app.delete("/api/custom-properties/:id", {
    schema: {
      tags: ["custom-properties"],
      params: propertyParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteCustomProperty(id);
    if (!deleted) return reply.code(404).send({
      message: "Custom property not found",
    });
    return reply.code(204).send();
  });

  app.get("/api/custom-properties/:id/tags", {
    schema: {
      tags: ["custom-properties"],
      params: propertyParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return getPropertyTagTree(id);
  });

  app.post("/api/custom-properties/:id/tags", {
    schema: {
      tags: ["custom-properties"],
      params: propertyParams,
      body: createPropertyTagBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const tag = await createPropertyTag(id, req.body as CreateCustomPropertyTagInput);
    if (!tag) return reply.code(404).send({
      message: "Custom property not found",
    });
    return reply.code(201).send(tag);
  });

  app.patch("/api/custom-properties/:id/tags/:tagId", {
    schema: {
      tags: ["custom-properties"],
      params: propertyTagParams,
      body: updatePropertyTagBody,
    },
  }, async (req, reply) => {
    const {
      id, tagId,
    } = req.params as { id: string;
      tagId: string; };
    try {
      const tag = await updatePropertyTag(id, tagId, req.body as UpdateCustomPropertyTagInput);
      if (!tag) return reply.code(404).send({
        message: "Custom property tag not found",
      });
      return tag;
    }
    catch (err) {
      if (err instanceof TagCycleError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/custom-properties/:id/tags/:tagId", {
    schema: {
      tags: ["custom-properties"],
      params: propertyTagParams,
    },
  }, async (req, reply) => {
    const {
      id, tagId,
    } = req.params as { id: string;
      tagId: string; };
    const deleted = await deletePropertyTag(id, tagId);
    if (!deleted) return reply.code(404).send({
      message: "Custom property tag not found",
    });
    return reply.code(204).send();
  });
}
