import type { FastifyInstance } from "fastify";
import type {
  CreateCustomPropertyInput,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import {
  createCustomProperty,
  CustomPropertyValidationError,
  deleteCustomProperty,
  listCustomProperties,
  updateCustomProperty,
} from "@/services/customProperties";

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

const uuidArray = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
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
      enum: ["number", "boolean", "calculate"],
    },
    numberMin: {
      type: ["number", "null"],
    },
    numberMax: {
      type: ["number", "null"],
    },
    unitSingular: {
      type: ["string", "null"],
    },
    unitPlural: {
      type: ["string", "null"],
    },
    operandPropertyIds: uuidArray,
    categoryIds: uuidArray,
  },
} as const;

const updatePropertyBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: createPropertyBody.properties.name,
    numberMin: createPropertyBody.properties.numberMin,
    numberMax: createPropertyBody.properties.numberMax,
    unitSingular: createPropertyBody.properties.unitSingular,
    unitPlural: createPropertyBody.properties.unitPlural,
    operandPropertyIds: uuidArray,
    categoryIds: uuidArray,
  },
} as const;

/** CRUD routes for custom properties, mounted under `/api/custom-properties`. */
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
    try {
      const property = await createCustomProperty(req.body as CreateCustomPropertyInput);
      return reply.code(201).send(property);
    }
    catch (err) {
      if (err instanceof CustomPropertyValidationError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    try {
      const property = await updateCustomProperty(id, req.body as UpdateCustomPropertyInput);
      if (!property) return reply.code(404).send({
        message: "Custom property not found",
      });
      return property;
    }
    catch (err) {
      if (err instanceof CustomPropertyValidationError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
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
}
