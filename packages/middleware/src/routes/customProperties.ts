import type { FastifyInstance } from "fastify";
import {
  CUSTOM_PROPERTY_TYPES,
  DATE_TIME_FORMATS,
  NUMBER_FORMATS,
} from "@eesimple/types";
import type {
  CreateCustomPropertyInput,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import {
  BuiltInPropertyError,
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

const nullableUuid = {
  type: ["string", "null"],
  format: "uuid",
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
      enum: [...CUSTOM_PROPERTY_TYPES],
    },
    numberFormat: {
      type: ["string", "null"],
      enum: [...NUMBER_FORMATS, null],
    },
    dateTimeFormat: {
      type: ["string", "null"],
      enum: [...DATE_TIME_FORMATS, null],
    },
    quickFilterRange: {
      type: ["number", "null"],
    },
    description: {
      type: ["string", "null"],
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
    valuePrefix: {
      type: ["string", "null"],
    },
    zeroLabel: {
      type: ["string", "null"],
    },
    maxLabel: {
      type: ["string", "null"],
    },
    operandPropertyIds: uuidArray,
    categoryIds: uuidArray,
    mediaTypeIds: uuidArray,
    showInForm: {
      type: "boolean",
    },
    hiddenFromForm: {
      type: "boolean",
    },
    showInListings: {
      type: "boolean",
    },
    showInGallery: {
      type: "boolean",
    },
    showInDetails: {
      type: "boolean",
    },
    allCategories: {
      type: "boolean",
    },
    allMediaTypes: {
      type: "boolean",
    },
    editableOnCard: {
      type: "boolean",
    },
    enabled: {
      type: "boolean",
    },
    allowDefault: {
      type: "boolean",
    },
    booleanLabelPreset: {
      type: ["string", "null"],
      enum: ["yes-no", "true-false", "enabled-disabled", "icons", "stars", "custom", null],
    },
    booleanTrueLabel: {
      type: ["string", "null"],
    },
    booleanFalseLabel: {
      type: ["string", "null"],
    },
    ratingMax: {
      type: ["number", "null"],
      enum: [3, 5, null],
    },
    ratingAllowZero: {
      type: "boolean",
    },
    ratingAllowHalf: {
      type: "boolean",
    },
    ratingShowLabel: {
      type: "boolean",
    },
    ratingLabel: {
      type: ["string", "null"],
    },
    propertyGroupId: nullableUuid,
  },
} as const;

const updatePropertyBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: createPropertyBody.properties.name,
    numberFormat: createPropertyBody.properties.numberFormat,
    dateTimeFormat: createPropertyBody.properties.dateTimeFormat,
    quickFilterRange: createPropertyBody.properties.quickFilterRange,
    description: createPropertyBody.properties.description,
    numberMin: createPropertyBody.properties.numberMin,
    numberMax: createPropertyBody.properties.numberMax,
    unitSingular: createPropertyBody.properties.unitSingular,
    unitPlural: createPropertyBody.properties.unitPlural,
    valuePrefix: createPropertyBody.properties.valuePrefix,
    zeroLabel: createPropertyBody.properties.zeroLabel,
    maxLabel: createPropertyBody.properties.maxLabel,
    operandPropertyIds: uuidArray,
    categoryIds: uuidArray,
    mediaTypeIds: uuidArray,
    showInForm: createPropertyBody.properties.showInForm,
    hiddenFromForm: createPropertyBody.properties.hiddenFromForm,
    showInListings: createPropertyBody.properties.showInListings,
    showInGallery: createPropertyBody.properties.showInGallery,
    showInDetails: createPropertyBody.properties.showInDetails,
    allCategories: createPropertyBody.properties.allCategories,
    allMediaTypes: createPropertyBody.properties.allMediaTypes,
    editableOnCard: createPropertyBody.properties.editableOnCard,
    enabled: createPropertyBody.properties.enabled,
    allowDefault: createPropertyBody.properties.allowDefault,
    booleanLabelPreset: createPropertyBody.properties.booleanLabelPreset,
    booleanTrueLabel: createPropertyBody.properties.booleanTrueLabel,
    booleanFalseLabel: createPropertyBody.properties.booleanFalseLabel,
    ratingMax: createPropertyBody.properties.ratingMax,
    ratingAllowZero: createPropertyBody.properties.ratingAllowZero,
    ratingAllowHalf: createPropertyBody.properties.ratingAllowHalf,
    ratingShowLabel: createPropertyBody.properties.ratingShowLabel,
    ratingLabel: createPropertyBody.properties.ratingLabel,
    propertyGroupId: createPropertyBody.properties.propertyGroupId,
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
      if (err instanceof BuiltInPropertyError) {
        return reply.code(403).send({
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
    try {
      const deleted = await deleteCustomProperty(id);
      if (!deleted) return reply.code(404).send({
        message: "Custom property not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInPropertyError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
