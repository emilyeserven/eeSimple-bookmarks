import { LAYOUTABLE_ENTITY_KINDS } from "@eesimple/types";

/**
 * Shared Fastify JSON-Schema fragments for the `entity-layouts` routes. The `:kind` enum
 * **derives** from `LAYOUTABLE_ENTITY_KINDS` (mirrors `routes/cardFieldZonesSchema.ts`'s
 * derive-from-tuple approach), so a new layoutable kind updates this schema for free.
 *
 * `entityLayoutSchema` mirrors the shape of `EntityLayout`/`LayoutTab`/`LayoutSection` in
 * `@eesimple/types` by hand — those are nested, optional-field interfaces, so unlike the flat
 * `CardFieldPlacement` map in `cardFieldZonesSchema.ts` they can't be `satisfies`-checked exhaustive
 * against this schema at compile time. This schema only needs to be good enough for basic
 * typing/Swagger docs; the real shape guard is `isValidEntityLayout()` (also from
 * `@eesimple/types`), called explicitly in the route handler.
 */

/** The `:kind` route param — one of the layoutable entity kinds. */
export const layoutableEntityKindSchema = {
  type: "string",
  enum: [...LAYOUTABLE_ENTITY_KINDS],
} as const;

const layoutSectionSchema = {
  type: "object",
  required: ["key", "fields"],
  additionalProperties: false,
  properties: {
    key: {
      type: "string",
    },
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    columns: {
      type: "integer",
    },
    visibleIf: {
      $ref: "conditionTree#",
    },
    fields: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
} as const;

const layoutTabSchema = {
  type: "object",
  required: ["key", "label", "sections"],
  additionalProperties: false,
  properties: {
    key: {
      type: "string",
    },
    label: {
      type: "string",
    },
    icon: {
      type: "string",
    },
    description: {
      type: "string",
    },
    sections: {
      type: "array",
      items: layoutSectionSchema,
    },
  },
} as const;

/** An `EntityLayout`: `{ tabs: LayoutTab[] }`. */
export const entityLayoutSchema = {
  type: "object",
  required: ["tabs"],
  additionalProperties: false,
  properties: {
    tabs: {
      type: "array",
      items: layoutTabSchema,
    },
  },
} as const;
