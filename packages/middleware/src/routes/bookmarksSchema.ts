import { SECTION_ENTRY_TYPES } from "@eesimple/types";

/**
 * Shared Fastify JSON-Schema fragments for `bookmarks.ts` and `bookmarkPropertyFileRoutes.ts` —
 * moved out of `bookmarks.ts` verbatim (see `bookmarkParamsSchema.ts` for the pattern this
 * mirrors).
 *
 * `updateBookmarkBody` (and the `sections`/entry sub-schema it shares with `createBookmarkBody`)
 * is exported for the sections round-trip schema test: these bodies are `additionalProperties:
 * false` and Fastify's AJV strips unknown props, so a SectionEntry field missing from the schema
 * silently vanishes on every whole-set PATCH (the `completed`/`url` failure mode).
 */

export const propertyFileParams = {
  type: "object",
  required: ["id", "propertyId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    propertyId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

export const listQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    tags: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

export const onHostQuery = {
  type: "object",
  required: ["domain"],
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

export const urlCheckQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
    },
    isbn: {
      type: "string",
      minLength: 1,
    },
    plexRatingKey: {
      type: "string",
      minLength: 1,
    },
    kavitaSeriesId: {
      type: "number",
    },
    feedUrl: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

export const createBookmarkBody = {
  type: "object",
  required: ["title"],
  additionalProperties: false,
  properties: {
    url: {
      type: ["string", "null"],
    },
    secondaryUrl: {
      type: ["string", "null"],
    },
    title: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
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
    genreMoodIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    languageUsages: {
      type: "array",
      items: {
        type: "object",
        required: ["languageId", "usageLevelId"],
        additionalProperties: false,
        properties: {
          languageId: {
            type: "string",
            format: "uuid",
          },
          usageLevelId: {
            type: "string",
            format: "uuid",
          },
          note: {
            type: ["string", "null"],
          },
        },
      },
    },
    names: {
      type: "array",
      items: {
        type: "object",
        required: ["languageId", "value"],
        additionalProperties: false,
        properties: {
          languageId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "string",
          },
          isPrimary: {
            type: "boolean",
          },
        },
      },
    },
    siteLanguageCode: {
      type: ["string", "null"],
    },
    locationIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    locationRelationByLocationId: {
      type: "object",
      additionalProperties: {
        type: ["string", "null"],
        format: "uuid",
      },
    },
    blacklistedTagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    blacklistedLocationIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    personIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    groupIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    numberValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "value"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "number",
          },
          valueEnd: {
            type: ["number", "null"],
          },
        },
      },
    },
    booleanValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "value"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "boolean",
          },
        },
      },
    },
    dateTimeValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "value"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "string",
          },
        },
      },
    },
    choicesValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "values"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          values: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    },
    progressValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "current", "total"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          current: {
            type: "number",
          },
          total: {
            type: "number",
          },
          // Per-bookmark counter-word override. AJV strips unknown props on whole-set PATCH, so
          // every optional segment must be declared here or it silently vanishes on save.
          textOverride: {
            type: ["object", "null"],
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
          // Per-bookmark auto-spacing toggle (null/absent = on). Must be declared or AJV strips it.
          autoSpace: {
            type: ["boolean", "null"],
          },
        },
      },
    },
    sectionsValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "exhaustive", "sections"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          exhaustive: {
            type: "boolean",
          },
          sections: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "name", "type", "startValue"],
              additionalProperties: false,
              properties: {
                id: {
                  type: "string",
                },
                name: {
                  type: "string",
                },
                type: {
                  type: "string",
                  enum: [...SECTION_ENTRY_TYPES],
                },
                startValue: {
                  type: "string",
                },
                endValue: {
                  type: "string",
                },
                // These schemas are `additionalProperties: false` and Fastify's AJV strips unknown
                // props, so EVERY optional SectionEntry field must be listed here (and in the child
                // schema below) or whole-set PATCHes silently drop it.
                url: {
                  type: "string",
                },
                completed: {
                  type: "boolean",
                },
                excludeFromProgress: {
                  type: "boolean",
                },
                tagIds: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                // Optional second tier — leaf children only (the leaf schema has no `children` key,
                // so nesting is capped at depth 2).
                children: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "name", "type", "startValue"],
                    additionalProperties: false,
                    properties: {
                      id: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      type: {
                        type: "string",
                        enum: [...SECTION_ENTRY_TYPES],
                      },
                      startValue: {
                        type: "string",
                      },
                      endValue: {
                        type: "string",
                      },
                      url: {
                        type: "string",
                      },
                      completed: {
                        type: "boolean",
                      },
                      excludeFromProgress: {
                        type: "boolean",
                      },
                      tagIds: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    textValues: {
      type: "array",
      items: {
        type: "object",
        required: ["propertyId", "value"],
        additionalProperties: false,
        properties: {
          propertyId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "string",
          },
        },
      },
    },
    priority: {
      type: "integer",
    },
    websiteSiteName: {
      type: "string",
      minLength: 1,
    },
    mediaTypeId: {
      type: ["string", "null"],
      format: "uuid",
    },
    youtubeChannelId: {
      type: ["string", "null"],
      format: "uuid",
    },
    youtubeChannel: {
      type: ["object", "null"],
      required: ["key", "name"],
      additionalProperties: false,
      properties: {
        key: {
          type: "string",
          minLength: 1,
        },
        name: {
          type: "string",
          minLength: 1,
        },
        selfIds: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
          },
        },
      },
    },
    originalUrl: {
      type: ["string", "null"],
    },
    kavitaSeriesId: {
      type: ["integer", "null"],
    },
    kavitaLibraryId: {
      type: ["integer", "null"],
    },
    kavitaSeriesName: {
      type: ["string", "null"],
    },
    plexRatingKey: {
      type: ["string", "null"],
    },
    plexItemType: {
      type: ["string", "null"],
    },
    plexItemTitle: {
      type: ["string", "null"],
    },
    isbn: {
      type: ["string", "null"],
    },
    year: {
      type: ["integer", "null"],
    },
    wikidataId: {
      type: ["string", "null"],
    },
    wikipediaLinkEn: {
      type: ["string", "null"],
    },
    wikipediaLinkLocal: {
      type: ["string", "null"],
    },
    feedUrl: {
      type: ["string", "null"],
    },
    itunesId: {
      type: ["integer", "null"],
    },
    itunesUrl: {
      type: ["string", "null"],
    },
    spotifyUrl: {
      type: ["string", "null"],
    },
    pocketCastsUuid: {
      type: ["string", "null"],
    },
    pocketCastsUrl: {
      type: ["string", "null"],
    },
    defaultLinkProvider: {
      type: ["string", "null"],
    },
    imageDisplayPreference: {
      type: "string",
      enum: ["auto", "image", "screenshot"],
    },
  },
} as const;

// Exported for the sections round-trip schema test: these bodies are `additionalProperties: false`
// and Fastify's AJV strips unknown props, so a SectionEntry field missing from the schema silently
// vanishes on every whole-set PATCH (the `completed`/`url` failure mode).
export const updateBookmarkBody = {
  type: "object",
  additionalProperties: false,
  properties: createBookmarkBody.properties,
} as const;

const idArray = {
  type: "array",
  minItems: 1,
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

export const bulkUrlBody = {
  type: "object",
  required: ["items"],
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "url"],
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          url: {
            type: "string",
            format: "uri",
          },
        },
      },
    },
  },
} as const;

export const bulkIdsBody = {
  type: "object",
  required: ["ids"],
  additionalProperties: false,
  properties: {
    ids: idArray,
  },
} as const;

export const bulkUpdateBody = {
  type: "object",
  required: ["ids", "patch"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    patch: updateBookmarkBody,
  },
} as const;

export const bulkTagsBody = {
  type: "object",
  required: ["ids", "tagIds", "op"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    op: {
      type: "string",
      enum: ["add", "remove"],
    },
  },
} as const;
