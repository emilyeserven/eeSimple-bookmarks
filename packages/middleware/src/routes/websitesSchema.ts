import { SECTION_ENTRY_TYPES, SOCIAL_MEDIA_PLATFORMS, TAXONOMY_ENTITY_ASSOCIATIONS, TAXONOMY_ENTITY_FIELDS, TAXONOMY_ENTITY_WRITE_KEYS, WEBSITE_SCAN_OBSERVATION_KINDS } from "@eesimple/types";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";

/**
 * Fastify JSON-Schema fragments for `routes/websites.ts`, split out because the extension-fill /
 * sections cluster below is large and hand-maintained in lockstep with the `FillTarget` union and
 * `extensionFillGroups.ts` (see the `extension-fill-target` skill). Schemas are kept verbatim from
 * their prior inline home — do not alter any property while touching this file.
 */

export const websiteParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

export const lookupQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

export const shortenedLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["domain", "expandTo", "keepShortened"],
    additionalProperties: false,
    properties: {
      domain: {
        type: "string",
        minLength: 1,
      },
      expandTo: {
        type: ["string", "null"],
      },
      keepShortened: {
        type: "boolean",
      },
    },
  },
} as const;

export const paramRulesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["pathSuffix", "params"],
    additionalProperties: false,
    properties: {
      pathSuffix: {
        type: "string",
      },
      matchMode: {
        type: "string",
        enum: ["suffix", "contains"],
      },
      params: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
} as const;

export const createWebsiteBody = {
  type: "object",
  required: ["domain"],
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      minLength: 1,
    },
    siteName: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
  },
} as const;

export const alternateNamesSchema = {
  type: "array",
  items: {
    type: "string",
    minLength: 1,
  },
} as const;

export const textMatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "value"],
  properties: {
    mode: {
      type: "string",
      enum: ["equals", "contains", "regex"],
    },
    value: {
      type: "string",
    },
    caseSensitive: {
      type: "boolean",
    },
  },
} as const;

/**
 * The extension-fill discriminated unions below use a merged-properties `object` + `allOf`
 * `if`/`then` per `kind`, NOT a `oneOf` of per-kind branches. Fastify's default AJV options set
 * `removeAdditional: true`, and `oneOf` evaluates every branch to confirm exactly one matches — so
 * a wrong branch with `additionalProperties: false` permanently strips any of the payload's real
 * properties it doesn't recognize *before* failing, corrupting (or outright rejecting) an
 * otherwise-valid payload for a sibling `kind` whose required fields happen to be a superset of an
 * earlier-evaluated branch's (see https://ajv.js.org/guide/modifying-data.html). `if`/`then`
 * sidesteps this: one `additionalProperties: false` pass over the union of every kind's fields,
 * with per-kind required-field enforcement layered on top.
 */
export const fillFilterSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["selfText", "siblingText", "ancestorText", "closest", "nth", "exclude"],
    },
    match: textMatchSchema,
    maxDepth: {
      type: "number",
    },
    selector: {
      type: "string",
    },
    index: {
      type: "number",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "selfText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "siblingText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "ancestorText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "closest",
          },
        },
      },
      then: {
        required: ["kind", "selector"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "nth",
          },
        },
      },
      then: {
        required: ["kind", "index"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "exclude",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
  ],
} as const;

export const fillTransformSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["regex", "number", "duration", "date", "replace", "trim", "affix", "absoluteUrl", "youtubeThumbnail"],
    },
    pattern: {
      type: "string",
    },
    flags: {
      type: "string",
    },
    group: {
      type: "number",
    },
    replacement: {
      type: "string",
    },
    prefix: {
      type: "string",
    },
    suffix: {
      type: "string",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "regex",
          },
        },
      },
      then: {
        required: ["kind", "pattern"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "replace",
          },
        },
      },
      then: {
        required: ["kind", "pattern", "replacement"],
      },
    },
  ],
} as const;

export const fillReadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["text", "attr", "backgroundImage"],
    },
    name: {
      type: "string",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "attr",
          },
        },
      },
      then: {
        required: ["kind", "name"],
      },
    },
  ],
} as const;

export const fillExtractSchema = {
  type: "object",
  additionalProperties: false,
  // `selector` is required only for the (default) selector source; a `meta` source uses `metaKey`
  // instead, so neither is unconditionally required here — the client normalizer drops a rule that
  // has neither.
  properties: {
    source: {
      type: "string",
      enum: ["selector", "meta"],
    },
    selector: {
      type: "string",
    },
    metaKey: {
      type: "string",
    },
    filters: {
      type: "array",
      items: fillFilterSchema,
    },
    excludeSelectors: {
      type: "array",
      items: {
        type: "string",
      },
    },
    read: fillReadSchema,
    transform: {
      type: "array",
      items: fillTransformSchema,
    },
    split: {
      type: "string",
    },
  },
} as const;

// `taxonomyDirect` target: how the entity is resolved from the page. `select` (match mode) is a
// full extract sub-schema; declared standalone so both the target schema and the fill-rule-group
// `taxonomyDirect.resolve` override schema can reuse it.
export const fillResolveSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode"],
  properties: {
    mode: {
      type: "string",
      enum: ["url", "match"],
    },
    select: fillExtractSchema,
  },
  allOf: [
    {
      if: {
        properties: {
          mode: {
            const: "match",
          },
        },
      },
      then: {
        required: ["mode", "select"],
      },
    },
  ],
} as const;

const FILL_TARGET_KINDS = ["field", "customProperty", "taxonomy", "image", "taxonomyEntity", "taxonomyDirect", "sections"] as const;

/** One composed-name part on a `sections` target: a relative selector + its own read/filters/transforms. */
const sectionNamePartSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    selector: {
      type: "string",
    },
    read: fillReadSchema,
    filters: {
      type: "array",
      items: fillFilterSchema,
    },
    transform: {
      type: "array",
      items: fillTransformSchema,
    },
  },
} as const;

export const fillTargetSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: [...FILL_TARGET_KINDS],
    },
    field: {
      type: "string",
      // `field` is reused by the `field` (bookmark scalar), `taxonomyEntity`, and `taxonomyDirect`
      // targets; the per-kind `if/then` below picks which enum applies via a nested `field` schema.
    },
    resolve: fillResolveSchema,
    propertyId: {
      type: "string",
      format: "uuid",
    },
    subField: {
      type: "string",
      enum: ["current", "total"],
    },
    choiceValue: {
      type: "string",
    },
    ratingBound: {
      type: "string",
      enum: ["from", "to", "range"],
    },
    ratingSelector: {
      type: "string",
    },
    ratingMatchExact: {
      type: "boolean",
    },
    ratingMatchCaseSensitive: {
      type: "boolean",
    },
    ratingLevels: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["level"],
        properties: {
          level: {
            type: "number",
          },
          selector: {
            type: "string",
          },
          matchText: {
            type: "string",
          },
        },
      },
    },
    taxonomy: {
      type: "string",
      enum: ["people", "groups", "locations", "tags"],
    },
    setMain: {
      type: "boolean",
    },
    association: {
      type: "string",
      enum: [...TAXONOMY_ENTITY_ASSOCIATIONS],
    },
    socialPlatform: {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
    // `sections` target: entry type + optional relative sub-selectors for the tiered / named build.
    entryType: {
      type: "string",
      enum: [...SECTION_ENTRY_TYPES],
    },
    container: {
      type: "string",
    },
    header: {
      type: "string",
    },
    itemName: {
      type: "string",
    },
    itemUrl: {
      type: "string",
    },
    // `sections` target: compose each item's name from multiple child elements (joined by namePartSeparator).
    nameParts: {
      type: "array",
      items: sectionNamePartSchema,
    },
    namePartSeparator: {
      type: "string",
    },
    // `sections` target: text-content classifier grouping a flat item list into sections/subsections.
    sectionMatch: textMatchSchema,
    // `sections` target: global selector matching each section header on a flat page (items group under it).
    sectionHeaderSelector: {
      type: "string",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "field",
          },
        },
      },
      then: {
        required: ["kind", "field"],
        properties: {
          field: {
            enum: ["title", "description", "isbn", "year"],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "customProperty",
          },
        },
      },
      then: {
        required: ["kind", "propertyId"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomy",
          },
        },
      },
      then: {
        required: ["kind", "taxonomy"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomyEntity",
          },
        },
      },
      then: {
        required: ["kind", "association", "field"],
        properties: {
          field: {
            // Scalar fields + `relation:<key>` relations + `language` (see TAXONOMY_ENTITY_WRITE_KEYS).
            enum: [...TAXONOMY_ENTITY_WRITE_KEYS],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomyDirect",
          },
        },
      },
      then: {
        required: ["kind", "association", "resolve", "field"],
        properties: {
          field: {
            // `image` is fillable here (multipart endpoint) but not in the JSON `taxonomyEntity` set.
            enum: [...TAXONOMY_ENTITY_FIELDS, "image"],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "sections",
          },
        },
      },
      then: {
        required: ["kind", "propertyId", "entryType"],
      },
    },
  ],
} as const;

export const pathMatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "value"],
  properties: {
    mode: {
      type: "string",
      enum: ["prefix", "contains", "suffix", "regex"],
    },
    value: {
      type: "string",
    },
  },
} as const;

export const extensionFillRulesSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "label", "target", "extract"],
    properties: {
      id: {
        type: "string",
      },
      label: {
        type: "string",
      },
      pathMatch: pathMatchSchema,
      target: fillTargetSchema,
      extract: fillExtractSchema,
      // Membership in an extension-fill-rule group. Declared here (and NOT stripped by
      // `removeAdditional`) so a grouped rule reopens in its group after the PATCH round-trip.
      groupId: {
        type: "string",
      },
    },
  },
} as const;

// The scraping-layout bundle a `sections.layout` override carries (see `extensionFillGroups.ts`).
export const sectionsLayoutOverrideSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    container: {
      type: "string",
    },
    header: {
      type: "string",
    },
    itemName: {
      type: "string",
    },
    itemUrl: {
      type: "string",
    },
    sectionMatch: textMatchSchema,
    sectionHeaderSelector: {
      type: "string",
    },
  },
} as const;

// A fill-rule group's overrides — one optional property per OverrideKey (kept in lockstep with
// `packages/types/src/extensionFillGroups.ts`; `additionalProperties: false` 400s an unknown key).
export const extensionFillOverridesSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    "pathMatch": pathMatchSchema,
    "target.kind": {
      type: "string",
      enum: [...FILL_TARGET_KINDS],
    },
    "field.field": {
      type: "string",
      enum: ["title", "description", "isbn", "year"],
    },
    "customProperty.propertyId": {
      type: "string",
      format: "uuid",
    },
    "customProperty.subField": {
      type: "string",
      enum: ["current", "total"],
    },
    "customProperty.choiceValue": {
      type: "string",
    },
    "taxonomy.taxonomy": {
      type: "string",
      enum: ["people", "groups", "locations", "tags"],
    },
    "image.setMain": {
      type: "boolean",
    },
    "taxonomyEntity.association": {
      type: "string",
      enum: [...TAXONOMY_ENTITY_ASSOCIATIONS],
    },
    "taxonomyEntity.field": {
      type: "string",
      enum: [...TAXONOMY_ENTITY_WRITE_KEYS],
    },
    "taxonomyEntity.socialPlatform": {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
    "taxonomyDirect.association": {
      type: "string",
      enum: [...TAXONOMY_ENTITY_ASSOCIATIONS],
    },
    "taxonomyDirect.resolve": fillResolveSchema,
    "taxonomyDirect.field": {
      type: "string",
      enum: [...TAXONOMY_ENTITY_FIELDS, "image"],
    },
    "taxonomyDirect.socialPlatform": {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
    "sections.propertyId": {
      type: "string",
      format: "uuid",
    },
    "sections.entryType": {
      type: "string",
      enum: [...SECTION_ENTRY_TYPES],
    },
    "sections.layout": sectionsLayoutOverrideSchema,
  },
} as const;

export const extensionFillRuleGroupsSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "label", "overrides"],
    properties: {
      id: {
        type: "string",
      },
      label: {
        type: "string",
      },
      parentId: {
        type: "string",
      },
      overrides: extensionFillOverridesSchema,
    },
  },
} as const;

export const scanObservationsSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["kind", "source"],
    properties: {
      kind: {
        type: "string",
        enum: [...WEBSITE_SCAN_OBSERVATION_KINDS],
      },
      detail: {
        type: "string",
      },
      source: {
        type: "string",
        enum: ["scanner", "manual"],
      },
      updatedAt: {
        type: "string",
      },
    },
  },
} as const;

export const socialLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["platform", "url"],
    additionalProperties: false,
    properties: {
      platform: {
        type: "string",
        enum: SOCIAL_MEDIA_PLATFORMS,
      },
      url: {
        type: "string",
        minLength: 1,
      },
    },
  },
} as const;

export const updateWebsiteBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    siteName: {
      type: "string",
      minLength: 1,
    },
    domain: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
    categoryId: {
      type: ["string", "null"],
      format: "uuid",
    },
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    mediaTypeId: {
      type: ["string", "null"],
      format: "uuid",
    },
    socialLinks: socialLinksSchema,
    labeledWebsites: labeledWebsitesSchema,
    youtubeChannelIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    alternateNames: alternateNamesSchema,
    extensionFillRules: extensionFillRulesSchema,
    extensionFillRuleGroups: extensionFillRuleGroupsSchema,
    scanObservations: scanObservationsSchema,
    redirectResolutionFailure: {
      type: "boolean",
    },
    scanUrlForIsbn: {
      type: "boolean",
    },
    isFavorite: {
      type: "boolean",
    },
  },
} as const;

const idArray = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

export const bulkUpdateBody = {
  type: "object",
  required: ["ids", "patch"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    patch: updateWebsiteBody,
  },
} as const;

export const bulkTagsBody = {
  type: "object",
  required: ["ids", "tagIds", "op"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    tagIds: idArray,
    op: {
      type: "string",
      enum: ["add", "remove"],
    },
  },
} as const;
