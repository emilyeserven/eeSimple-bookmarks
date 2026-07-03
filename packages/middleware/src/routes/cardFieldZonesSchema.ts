import type { CardFieldPlacement } from "@eesimple/types";

import { CARD_BODY_ZONES, CARD_FIELD_ZONES } from "@eesimple/types";

/**
 * Shared Fastify JSON-Schema fragments for the per-zone card-field placement model
 * (`CardFieldZones` + `CardZoneLayouts` in @eesimple/types). Used by both the card-display-rules
 * routes and the homepage-sections routes. The zone-name sets **derive** from the
 * `CARD_FIELD_ZONES` / `CARD_BODY_ZONES` tuples, and the placement-prop map is checked exhaustive
 * against `CardFieldPlacement` at compile time — adding a zone or a placement prop in
 * @eesimple/types updates (or fails) this schema instead of silently drifting.
 */

/**
 * Per-prop JSON Schema for a `CardFieldPlacement`. The `satisfies` clause makes this map
 * exhaustive: a new prop on the shared type fails `tsc` here until its schema is added.
 */
const PLACEMENT_PROP_SCHEMAS = {
  key: {
    type: "string",
  },
  scale: {
    type: "number",
    enum: [0.75, 1, 1.5, 2],
  },
  mobileScale: {
    type: ["number", "null"],
    enum: [0.75, 1, 1.5, 2, null],
  },
  hideLabel: {
    type: "boolean",
  },
  hideIcon: {
    type: "boolean",
  },
  // Boolean custom-property fields only (see CardFieldPlacement in @eesimple/types).
  showIfFalse: {
    type: "boolean",
  },
  clickableInView: {
    type: "boolean",
  },
  clickableInOverlay: {
    type: "boolean",
  },
  showLabelColon: {
    type: "boolean",
  },
  showValueBeforeLabel: {
    type: "boolean",
  },
  // Tags field in the card-table zone only (see CardFieldPlacement in @eesimple/types).
  clickableTags: {
    type: "boolean",
  },
  // Tags field, any zone (see CardFieldPlacement in @eesimple/types).
  showTagHierarchyOnHover: {
    type: "boolean",
  },
  // Media Type field, any zone (see CardFieldPlacement in @eesimple/types).
  showMediaTypeHierarchyOnHover: {
    type: "boolean",
  },
  // Locations field, any zone (see CardFieldPlacement in @eesimple/types).
  showLocationHierarchyOnHover: {
    type: "boolean",
  },
  // Genres & Moods field, any zone (see CardFieldPlacement in @eesimple/types).
  showGenreMoodHierarchyOnHover: {
    type: "boolean",
  },
} as const satisfies Record<keyof CardFieldPlacement, unknown>;

/**
 * `fieldZones`: per-zone field placements. `null` = inherit / fall back. Each zone holds an ordered
 * array of placements; a field key absent from all zones is hidden.
 */
export const fieldZonesSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: Object.fromEntries(
    CARD_FIELD_ZONES.map(
      zone => [zone, {
        type: "array",
        items: {
          type: "object",
          required: ["key"],
          additionalProperties: false,
          properties: PLACEMENT_PROP_SCHEMAS,
        },
      }],
    ),
  ),
} as const;

/**
 * `cardZoneLayouts`: per-body-zone layout; `null` = inherit / fall back. Each value is a
 * `{ mode, gap?, align?, alignItems?, direction?, wrap? }` object (mirror of `CardZoneLayout`), but
 * the legacy bare-string form (`"flex"`/`"grid"`) is still accepted so in-flight payloads from older
 * clients validate.
 */
export const cardZoneLayoutsSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: Object.fromEntries(
    CARD_BODY_ZONES.map(zone => [zone, {
      oneOf: [
        {
          type: "string",
          enum: ["flex", "grid"],
        },
        {
          type: "object",
          additionalProperties: false,
          required: ["mode"],
          properties: {
            mode: {
              type: "string",
              enum: ["flex", "grid"],
            },
            gap: {
              type: "string",
              enum: ["sm", "md", "lg"],
            },
            align: {
              type: "string",
              enum: ["start", "center", "end", "between"],
            },
            alignItems: {
              type: "string",
              enum: ["start", "center", "end", "stretch"],
            },
            direction: {
              type: "string",
              enum: ["row", "column"],
            },
            wrap: {
              type: "string",
              enum: ["wrap", "nowrap"],
            },
          },
        },
      ],
    }]),
  ),
} as const;
