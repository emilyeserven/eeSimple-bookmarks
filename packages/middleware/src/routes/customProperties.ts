import type { FastifyInstance } from "fastify";
import {
  CHOICES_DISPLAY_TYPES,
  CUSTOM_PROPERTY_TYPES,
  DATE_TIME_FORMATS,
  NUMBER_FORMATS,
  RATING_DISPLAYS,
  RATING_MAX_LIMIT,
  RATING_MAX_MIN,
  SECTION_ENTRY_TYPES,
} from "@eesimple/types";
import type {
  CreateCustomPropertyInput,
  UpdateCustomPropertyInput,
} from "@eesimple/types";
import {
  bulkDeleteCustomProperties,
  createCustomProperty,
  deleteCustomProperty,
  listCustomProperties,
  updateCustomProperty,
} from "@/services/customProperties";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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
    dateTimeAllowYearMonth: {
      type: "boolean",
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
    editableViaCmdk: {
      type: "boolean",
    },
    enabledInInbox: {
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
      type: ["integer", "null"],
      minimum: RATING_MAX_MIN,
      maximum: RATING_MAX_LIMIT,
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
    ratingAllowRange: {
      type: "boolean",
    },
    ratingLabels: {
      type: ["object", "null"],
      additionalProperties: {
        type: "string",
      },
    },
    ratingCategoryLabels: {
      type: ["object", "null"],
      additionalProperties: {
        type: "object",
        additionalProperties: {
          type: "string",
        },
      },
    },
    ratingDisplay: {
      type: ["string", "null"],
      enum: [...RATING_DISPLAYS, null],
    },
    ratingRangeIncludeStart: {
      type: "boolean",
    },
    choicesItems: {
      type: "array",
      items: {
        type: "object",
        required: ["label", "value"],
        additionalProperties: false,
        properties: {
          label: {
            type: "string",
          },
          value: {
            type: "string",
          },
          isDefault: {
            type: "boolean",
          },
        },
      },
    },
    choicesDisplay: {
      type: ["string", "null"],
      enum: [...CHOICES_DISPLAY_TYPES, null],
    },
    choicesMultiple: {
      type: "boolean",
    },
    itemInItemsBeforeText: {
      type: ["string", "null"],
    },
    itemInItemsBetweenText: {
      type: ["string", "null"],
    },
    itemInItemsAfterText: {
      type: ["string", "null"],
    },
    itemInItemsMediaTypeTexts: {
      type: ["object", "null"],
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        properties: {
          beforeText: {
            type: ["string", "null"],
          },
          betweenText: {
            type: ["string", "null"],
          },
          afterText: {
            type: ["string", "null"],
          },
        },
      },
    },
    itemInItemsSourcePropertyId: {
      type: ["string", "null"],
      format: "uuid",
    },
    sectionsDefaultType: {
      type: ["string", "null"],
      enum: [...SECTION_ENTRY_TYPES, null],
    },
    sectionsAllowedTypes: {
      type: ["array", "null"],
      items: {
        type: "string",
        enum: [...SECTION_ENTRY_TYPES],
      },
    },
    sectionsTiered: {
      type: ["boolean", "null"],
    },
  },
} as const;

const updatePropertyBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: createPropertyBody.properties.name,
    numberFormat: createPropertyBody.properties.numberFormat,
    dateTimeFormat: createPropertyBody.properties.dateTimeFormat,
    dateTimeAllowYearMonth: createPropertyBody.properties.dateTimeAllowYearMonth,
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
    enabledInInbox: createPropertyBody.properties.enabledInInbox,
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
    ratingAllowRange: createPropertyBody.properties.ratingAllowRange,
    ratingLabels: createPropertyBody.properties.ratingLabels,
    ratingCategoryLabels: createPropertyBody.properties.ratingCategoryLabels,
    ratingDisplay: createPropertyBody.properties.ratingDisplay,
    ratingRangeIncludeStart: createPropertyBody.properties.ratingRangeIncludeStart,
    choicesItems: createPropertyBody.properties.choicesItems,
    choicesDisplay: createPropertyBody.properties.choicesDisplay,
    choicesMultiple: createPropertyBody.properties.choicesMultiple,
    itemInItemsBeforeText: createPropertyBody.properties.itemInItemsBeforeText,
    itemInItemsBetweenText: createPropertyBody.properties.itemInItemsBetweenText,
    itemInItemsAfterText: createPropertyBody.properties.itemInItemsAfterText,
    itemInItemsMediaTypeTexts: createPropertyBody.properties.itemInItemsMediaTypeTexts,
    itemInItemsSourcePropertyId: createPropertyBody.properties.itemInItemsSourcePropertyId,
    sectionsDefaultType: createPropertyBody.properties.sectionsDefaultType,
    sectionsAllowedTypes: createPropertyBody.properties.sectionsAllowedTypes,
    sectionsTiered: createPropertyBody.properties.sectionsTiered,
    isFavorite: {
      type: "boolean",
    },
  },
} as const;

/** CRUD routes for custom properties, mounted under `/api/custom-properties`. */
export async function customPropertyRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/custom-properties", "custom-properties", bulkDeleteCustomProperties);

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
    if (!property) throw new NotFoundError("Custom property");
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
    if (!deleted) throw new NotFoundError("Custom property");
    return reply.code(204).send();
  });
}
