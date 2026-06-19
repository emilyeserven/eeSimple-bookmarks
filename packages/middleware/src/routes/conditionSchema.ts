/**
 * Shared JSON Schema for the recursive condition tree used by autofill rules and the homepage
 * filter. Registered once on the app via `addSchema` (see `app.ts`); request bodies reference it
 * with `{ $ref: "conditionTree#" }`.
 *
 * Validation uses plain `oneOf` over the node kinds (each branch pinned by a `type` const), which
 * keeps the schema portable without enabling AJV's discriminator option. A malformed node simply
 * matches zero branches and is rejected with a 400.
 */

const uuidArray = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

const matchNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "field", "operator", "pattern"],
  properties: {
    type: {
      const: "match",
    },
    field: {
      type: "string",
      enum: ["url", "title"],
    },
    operator: {
      type: "string",
      enum: ["contains", "starts_with", "regex", "domain"],
    },
    pattern: {
      type: "string",
    },
  },
} as const;

const categoryNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "categoryIds"],
  properties: {
    type: {
      const: "category",
    },
    categoryIds: uuidArray,
  },
} as const;

const websiteNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "domains"],
  properties: {
    type: {
      const: "website",
    },
    domains: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
} as const;

const tagNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "tagIds"],
  properties: {
    type: {
      const: "tag",
    },
    tagIds: uuidArray,
  },
} as const;

const youtubeChannelNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "channelIds"],
  properties: {
    type: {
      const: "youtube-channel",
    },
    channelIds: uuidArray,
  },
} as const;

const numberPredicate = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "min", "max"],
      properties: {
        kind: {
          const: "range",
        },
        min: {
          type: ["number", "null"],
        },
        max: {
          type: ["number", "null"],
        },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "mode"],
      properties: {
        kind: {
          const: "presence",
        },
        mode: {
          type: "string",
          enum: ["has", "missing"],
        },
      },
    },
  ],
} as const;

const booleanPredicate = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "value"],
      properties: {
        kind: {
          const: "value",
        },
        value: {
          type: "boolean",
        },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "mode"],
      properties: {
        kind: {
          const: "presence",
        },
        mode: {
          type: "string",
          enum: ["has", "missing"],
        },
      },
    },
  ],
} as const;

const dateTimePredicate = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "from", "to"],
      properties: {
        kind: {
          const: "range",
        },
        from: {
          type: ["string", "null"],
        },
        to: {
          type: ["string", "null"],
        },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "mode"],
      properties: {
        kind: {
          const: "presence",
        },
        mode: {
          type: "string",
          enum: ["has", "missing"],
        },
      },
    },
  ],
} as const;

const propertyNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "propertyId", "predicate"],
  properties: {
    type: {
      const: "property",
    },
    propertyId: {
      type: "string",
      format: "uuid",
    },
    predicate: {
      oneOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["valueKind", "predicate"],
          properties: {
            valueKind: {
              const: "number",
            },
            predicate: numberPredicate,
          },
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["valueKind", "predicate"],
          properties: {
            valueKind: {
              const: "boolean",
            },
            predicate: booleanPredicate,
          },
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["valueKind", "predicate"],
          properties: {
            valueKind: {
              const: "datetime",
            },
            predicate: dateTimePredicate,
          },
        },
      ],
    },
  },
} as const;

const groupNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "combinator", "children"],
  properties: {
    type: {
      const: "group",
    },
    combinator: {
      type: "string",
      enum: ["and", "or"],
    },
    children: {
      type: "array",
      items: {
        $ref: "conditionNode#",
      },
    },
  },
} as const;

/** Any node in the tree (group or one of the five leaf kinds). Self-references for nesting. */
export const conditionNodeSchema = {
  $id: "conditionNode",
  oneOf: [groupNode, matchNode, categoryNode, websiteNode, tagNode, youtubeChannelNode, propertyNode],
} as const;

/** The persisted root: always a group. Referenced by request bodies as `conditionTree#`. */
export const conditionTreeSchema = {
  $id: "conditionTree",
  type: "object",
  additionalProperties: false,
  required: ["type", "combinator", "children"],
  properties: {
    type: {
      const: "group",
    },
    combinator: {
      type: "string",
      enum: ["and", "or"],
    },
    children: {
      type: "array",
      items: {
        $ref: "conditionNode#",
      },
    },
  },
} as const;
