/**
 * Shared Fastify JSON-Schema fragments for the per-zone card-field placement model
 * (`CardFieldZones` + `CardZoneLayouts` in @eesimple/types). Used by both the card-display-rules
 * routes and the homepage-sections routes so the hand-listed zone names + placement props can't drift
 * between the two surfaces (CLAUDE.md flags this mirror as drift-prone — keep the zone-name lists in
 * sync with `CARD_FIELD_ZONES` / `CARD_BODY_ZONES`).
 */

/**
 * `fieldZones`: per-zone field placements. `null` = inherit / fall back. Each zone holds an ordered
 * array of placements; a field key absent from all zones is hidden. The zone-name set mirrors the
 * `CARD_FIELD_ZONES` union.
 */
export const fieldZonesSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: Object.fromEntries(
    [
      "card-single-top",
      "card-labels",
      "card-table",
      "card-single-bottom",
      "image-top-left",
      "image-top-right",
      "image-bottom-left",
      "image-bottom-right",
    ].map(
      zone => [zone, {
        type: "array",
        items: {
          type: "object",
          required: ["key"],
          additionalProperties: false,
          properties: {
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
            // Boolean custom-property fields only (mirror of CardFieldPlacement in @eesimple/types).
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
            // Tags field in the card-table zone only (mirror of CardFieldPlacement in @eesimple/types).
            clickableTags: {
              type: "boolean",
            },
          },
        },
      }],
    ),
  ),
} as const;

/**
 * `cardZoneLayouts`: per-body-zone layout; `null` = inherit / fall back. Each value is a
 * `{ mode, gap?, align?, alignItems?, direction?, wrap? }` object (mirror of `CardZoneLayout`), but
 * the legacy bare-string form (`"flex"`/`"grid"`) is still accepted so in-flight payloads from older
 * clients validate. The body-zone-name set mirrors `CARD_BODY_ZONES`.
 */
export const cardZoneLayoutsSchema = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: Object.fromEntries(
    [
      "card-single-top",
      "card-labels",
      "card-table",
      "card-single-bottom",
    ].map(zone => [zone, {
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
