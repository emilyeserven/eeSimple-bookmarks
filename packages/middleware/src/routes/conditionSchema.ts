/**
 * Shared JSON Schema for the recursive condition tree used by autofill rules and the homepage
 * filter. Registered once on the app via `addSchema` (see `app.ts`); request bodies reference it
 * with `{ $ref: "conditionTree#" }`.
 *
 * Validation uses plain `oneOf` over the node kinds (each branch pinned by a `type` const), which
 * keeps the schema portable without enabling AJV's discriminator option. A malformed node simply
 * matches zero branches and is rejected with a 400.
 */

import { CONDITION_VALUE_KINDS, SECTION_ENTRY_TYPES } from "@eesimple/types";
import type { ConditionValueKind } from "@eesimple/types";

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
    cascadeTagIds: uuidArray,
  },
} as const;

const locationNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "locationIds"],
  properties: {
    type: {
      const: "location",
    },
    locationIds: uuidArray,
    cascadeLocationIds: uuidArray,
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

const mediaTypeNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "mediaTypeIds"],
  properties: {
    type: {
      const: "media-type",
    },
    mediaTypeIds: uuidArray,
    cascadeMediaTypeIds: uuidArray,
  },
} as const;

const genreMoodNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "genreMoodIds"],
  properties: {
    type: {
      const: "genre-mood",
    },
    genreMoodIds: uuidArray,
    cascadeGenreMoodIds: uuidArray,
  },
} as const;

const taxonomyNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "taxonomyId", "termIds"],
  properties: {
    type: {
      const: "taxonomy",
    },
    taxonomyId: {
      type: "string",
      format: "uuid",
    },
    termIds: uuidArray,
    cascadeTermIds: uuidArray,
  },
} as const;

const relationshipTypeNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "relationshipTypeIds"],
  properties: {
    type: {
      const: "relationship-type",
    },
    relationshipTypeIds: uuidArray,
  },
} as const;

const languageUsageNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "languageIds", "usageLevelIds"],
  properties: {
    type: {
      const: "language-usage",
    },
    languageIds: uuidArray,
    usageLevelIds: uuidArray,
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

/** A `has`/`missing` presence predicate, used by `file` value-kind property conditions. */
const filePresencePredicate = {
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
} as const;

const choicesPredicate = {
  oneOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "values"],
      properties: {
        kind: {
          const: "includes",
        },
        values: {
          type: "array",
          items: {
            type: "string",
          },
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

const sectionsPredicate = {
  oneOf: [
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
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "types"],
      properties: {
        kind: {
          const: "sectionType",
        },
        types: {
          type: "array",
          items: {
            type: "string",
            enum: [...SECTION_ENTRY_TYPES],
          },
        },
      },
    },
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "value"],
      properties: {
        kind: {
          const: "exhaustive",
        },
        value: {
          type: "boolean",
        },
      },
    },
  ],
} as const;

const textPredicate = {
  oneOf: [
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
    {
      type: "object",
      additionalProperties: false,
      required: ["kind", "pattern"],
      properties: {
        kind: {
          const: "contains",
        },
        pattern: {
          type: "string",
        },
      },
    },
  ],
} as const;

// One predicate sub-schema per filterable value kind. `satisfies Record<ConditionValueKind, …>`
// makes a `CONDITION_VALUE_KINDS` entry without a predicate (or vice versa) a compile error, so the
// `oneOf` below can never drift from the shared `@eesimple/types` value-kind list.
const propertyPredicateByKind = {
  number: numberPredicate,
  boolean: booleanPredicate,
  datetime: dateTimePredicate,
  file: filePresencePredicate,
  choices: choicesPredicate,
  sections: sectionsPredicate,
  text: textPredicate,
} satisfies Record<ConditionValueKind, unknown>;

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
      oneOf: CONDITION_VALUE_KINDS.map(kind => ({
        type: "object",
        additionalProperties: false,
        required: ["valueKind", "predicate"],
        properties: {
          valueKind: {
            const: kind,
          },
          predicate: propertyPredicateByKind[kind],
        },
      })),
    },
  },
} as const;

const fillableFieldsNode = {
  type: "object",
  additionalProperties: false,
  required: ["type", "mode"],
  properties: {
    type: {
      const: "fillable-fields",
    },
    mode: {
      type: "string",
      enum: ["has", "missing"],
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

/** Any node in the tree (group or one of the leaf kinds). Self-references for nesting. */
export const conditionNodeSchema = {
  $id: "conditionNode",
  oneOf: [groupNode, matchNode, categoryNode, websiteNode, tagNode, locationNode, youtubeChannelNode, mediaTypeNode, genreMoodNode, taxonomyNode, relationshipTypeNode, languageUsageNode, propertyNode, fillableFieldsNode],
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
