import { MERGE_SCALAR_FIELDS } from "@eesimple/types";

/**
 * Body schema for `POST /api/duplicates/merge`. Every mergeable field is declared from the shared
 * `MERGE_SCALAR_FIELDS` tuple so the `additionalProperties: false` body can never silently strip a
 * pick (the AJV `removeAdditional` trap) — guarded by tests/duplicatesSchema.test.ts.
 */
export const mergeBody = {
  type: "object",
  required: ["survivorId", "loserIds", "fieldChoices"],
  additionalProperties: false,
  properties: {
    survivorId: {
      type: "string",
      format: "uuid",
    },
    loserIds: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "string",
        format: "uuid",
      },
    },
    fieldChoices: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(MERGE_SCALAR_FIELDS.map(field => [field, {
        type: "string",
        format: "uuid",
      }])),
    },
  },
} as const;
