import type { FastifyInstance } from "fastify";
import type { BulkBookmarkTagOp, BulkUrlUpdate, CreateBookmarkInput, UpdateBookmarkInput, UpdateBookmarkRelationshipsInput } from "@eesimple/types";
import { SECTION_ENTRY_TYPES } from "@eesimple/types";
import {
  getBookmarkImageRow,
  getBookmarkImageRowById,
  getBookmarkScreenshotRow,
} from "@/services/bookmarkImages";
import {
  getBookmarkPropertyFileRow,
  removeBookmarkPropertyFile,
  setBookmarkPropertyFile,
} from "@/services/bookmarkPropertyFiles";
import {
  backfillTitleLocations,
  backfillTitleTags,
  bulkDeleteBookmarks,
  bulkUpdateBookmarks,
  bulkUpdateBookmarkTags,
  bulkUpdateBookmarkUrls,
  checkBookmarkUrlDuplicate,
  createBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
  listBookmarksOnHost,
  updateBookmark,
  updateBookmarkRelationships,
} from "@/services/bookmarks";
import { getBookmarkReelArchiveRow } from "@/services/reelArchive";
import { quickAddBookmarkDirect, quickSaveToInbox } from "@/services/imports";
import { getObjectRange, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { isValidUrl } from "@/utils/url";
import { AppError, ImageTooLargeError, NoFileUploadedError, NotFoundError, StorageUnconfiguredError, ValidationError } from "@/utils/errors";
import { registerBookmarkImageRoutes } from "./bookmarkImageRoutes";
import { bookmarkImageParams, bookmarkParams } from "./bookmarkParamsSchema";

const propertyFileParams = {
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

const listQuery = {
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

const createBookmarkBody = {
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

const onHostQuery = {
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

const urlCheckQuery = {
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

const bulkUrlBody = {
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

const idArray = {
  type: "array",
  minItems: 1,
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

const bulkIdsBody = {
  type: "object",
  required: ["ids"],
  additionalProperties: false,
  properties: {
    ids: idArray,
  },
} as const;

const bulkUpdateBody = {
  type: "object",
  required: ["ids", "patch"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    patch: updateBookmarkBody,
  },
} as const;

const bulkTagsBody = {
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

/** Read/query routes: list, on-host filter, and url duplicate check. */
function registerBookmarkQueryRoutes(app: FastifyInstance): void {
  app.get("/api/bookmarks", {
    schema: {
      tags: ["bookmarks"],
      querystring: listQuery,
    },
  }, async (req) => {
    const {
      tags,
    } = req.query as { tags?: string[] };
    return listBookmarks(tags);
  });

  // Static sub-paths are declared before `/:id` so they aren't captured by the param route.
  app.get("/api/bookmarks/on-host", {
    schema: {
      tags: ["bookmarks"],
      querystring: onHostQuery,
    },
  }, async (req) => {
    const {
      domain,
    } = req.query as { domain: string };
    return listBookmarksOnHost(domain);
  });

  app.get("/api/bookmarks/url-check", {
    schema: {
      tags: ["bookmarks"],
      querystring: urlCheckQuery,
    },
  }, async (req) => {
    const {
      url, isbn, plexRatingKey, kavitaSeriesId, feedUrl,
    } = req.query as {
      url?: string;
      isbn?: string;
      plexRatingKey?: string;
      kavitaSeriesId?: number;
      feedUrl?: string;
    };
    const identity = {
      isbn,
      plexRatingKey,
      kavitaSeriesId,
      feedUrl,
    };
    if (!url && Object.values(identity).every(v => v == null)) {
      throw new ValidationError("url or an identity field is required");
    }
    return checkBookmarkUrlDuplicate(url, identity);
  });
}

/** Bulk operations over many bookmarks: url rewrite, delete, update, and tag add/remove. */
function registerBookmarkBulkRoutes(app: FastifyInstance): void {
  app.post("/api/bookmarks/bulk-url", {
    schema: {
      tags: ["bookmarks"],
      body: bulkUrlBody,
    },
  }, async (req) => {
    const {
      items,
    } = req.body as { items: BulkUrlUpdate[] };
    return bulkUpdateBookmarkUrls(items);
  });

  app.post("/api/bookmarks/bulk-delete", {
    schema: {
      tags: ["bookmarks"],
      body: bulkIdsBody,
    },
  }, async (req) => {
    const {
      ids,
    } = req.body as { ids: string[] };
    return bulkDeleteBookmarks(ids);
  });

  app.post("/api/bookmarks/bulk", {
    schema: {
      tags: ["bookmarks"],
      body: bulkUpdateBody,
    },
  }, async (req) => {
    const {
      ids, patch,
    } = req.body as { ids: string[];
      patch: UpdateBookmarkInput; };
    return bulkUpdateBookmarks(ids, patch);
  });

  app.post("/api/bookmarks/bulk-tags", {
    schema: {
      tags: ["bookmarks"],
      body: bulkTagsBody,
    },
  }, async (req) => {
    const {
      ids, tagIds, op,
    } = req.body as { ids: string[];
      tagIds: string[];
      op: BulkBookmarkTagOp; };
    return bulkUpdateBookmarkTags(ids, tagIds, op);
  });

  // Apply the "auto-tag from title" automation to every existing bookmark (additive, on demand).
  app.post("/api/bookmarks/backfill-title-tags", {
    schema: {
      tags: ["bookmarks"],
    },
  }, async () => backfillTitleTags());

  // Apply the "auto-apply locations from title" automation to every existing bookmark (additive).
  app.post("/api/bookmarks/backfill-title-locations", {
    schema: {
      tags: ["bookmarks"],
    },
  }, async () => backfillTitleLocations());
}

/** Single-bookmark CRUD: inbox quick-save, get, create, update, and delete. */
function registerBookmarkCrudRoutes(app: FastifyInstance): void {
  // Quick-save endpoint for the browser extension context-menu: accepts only url + optional
  // title, forces the Inbox built-in category, and skips no other bookmark logic.
  app.post("/api/bookmarks/inbox", {
    schema: {
      tags: ["bookmarks"],
      body: {
        type: "object",
        required: ["url"],
        additionalProperties: false,
        properties: {
          url: {
            type: "string",
            format: "uri",
          },
          title: {
            type: "string",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      url, title,
    } = req.body as { url: string;
      title?: string; };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    const item = await quickSaveToInbox(url, title?.trim() || url);
    if (!item) {
      throw new AppError("This URL is already saved.", "conflict", 409);
    }
    return reply.code(201).send(item);
  });

  // Direct-add endpoint for the browser extension's "Add as bookmark" button/context-menu and the
  // PWA share target when "shared links skip the inbox" is on: bypasses the Inbox and creates a full
  // bookmark, applying the same autofill/defaults/image-capture Inbox approval does.
  app.post("/api/bookmarks/quick-add", {
    schema: {
      tags: ["bookmarks"],
      body: {
        type: "object",
        required: ["url"],
        additionalProperties: false,
        properties: {
          url: {
            type: "string",
            format: "uri",
          },
          title: {
            type: "string",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      url, title,
    } = req.body as { url: string;
      title?: string; };
    if (!isValidUrl(url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    const bookmark = await quickAddBookmarkDirect(url, title?.trim() || url);
    if (!bookmark) {
      throw new AppError("This URL is already saved.", "conflict", 409);
    }
    return reply.code(201).send(bookmark);
  });

  app.get("/api/bookmarks/:id", {
    schema: {
      tags: ["bookmarks"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const bookmark = await getBookmark(id);
    if (!bookmark) throw new NotFoundError("Bookmark");
    return bookmark;
  });

  app.post("/api/bookmarks", {
    schema: {
      tags: ["bookmarks"],
      body: createBookmarkBody,
    },
  }, async (req, reply) => {
    const input = req.body as CreateBookmarkInput;
    if (input.url != null && !isValidUrl(input.url)) {
      throw new ValidationError("url must be a valid http(s) URL");
    }
    if (input.secondaryUrl != null && input.secondaryUrl !== "" && !isValidUrl(input.secondaryUrl)) {
      throw new ValidationError("secondaryUrl must be a valid http(s) URL");
    }
    const bookmark = await createBookmark(input);
    return reply.code(201).send(bookmark);
  });

  app.patch(
    "/api/bookmarks/:id",
    {
      schema: {
        tags: ["bookmarks"],
        params: bookmarkParams,
        body: updateBookmarkBody,
      },
    },
    async (req, reply) => {
      const {
        id,
      } = req.params as { id: string };
      const input = req.body as UpdateBookmarkInput;
      if (input.url != null && !isValidUrl(input.url)) {
        throw new ValidationError("url must be a valid http(s) URL");
      }
      if (input.secondaryUrl != null && input.secondaryUrl !== "" && !isValidUrl(input.secondaryUrl)) {
        throw new ValidationError("secondaryUrl must be a valid http(s) URL");
      }
      const bookmark = await updateBookmark(id, input);
      if (!bookmark) throw new NotFoundError("Bookmark");
      return bookmark;
    },
  );

  app.delete("/api/bookmarks/:id", {
    schema: {
      tags: ["bookmarks"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteBookmark(id);
    if (!deleted) throw new NotFoundError("Bookmark");
    return reply.code(204).send();
  });
}

/** Bookmark relationship edges and the image download endpoint. */
function registerBookmarkRelationshipRoutes(app: FastifyInstance): void {
  // Replace the full set of typed relationships for a bookmark (edges to other bookmarks).
  app.put("/api/bookmarks/:id/relationships", {
    schema: {
      tags: ["bookmarks"],
      params: bookmarkParams,
      body: {
        type: "object",
        required: ["relationships"],
        additionalProperties: false,
        properties: {
          relationships: {
            type: "array",
            items: {
              type: "object",
              required: ["bookmarkId", "relationshipTypeId"],
              additionalProperties: false,
              properties: {
                bookmarkId: {
                  type: "string",
                  format: "uuid",
                },
                relationshipTypeId: {
                  type: "string",
                  format: "uuid",
                },
                label: {
                  type: "string",
                  nullable: true,
                },
                direction: {
                  type: "string",
                  enum: ["parent", "child"],
                },
              },
            },
          },
        },
      } as const,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const input = req.body as UpdateBookmarkRelationshipsInput;
    const existing = await getBookmark(id);
    if (!existing) {
      throw new NotFoundError("Bookmark");
    }
    await updateBookmarkRelationships(id, input);
    return getBookmark(id);
  });

  // Serve a bookmark's image bytes by streaming them from object storage. The URL carries a `?v=`
  // version param, so it's safe to cache immutably — a replaced image gets a new URL.
  app.get("/api/bookmarks/:id/image", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getBookmarkImageRow(id);
    if (!row) {
      throw new NotFoundError("Image", "No image");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("Image", "No image");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });

  // Serve one specific image of a bookmark by id. Same immutable `?v=` caching as `/image`.
  app.get("/api/bookmarks/:id/images/:imageId", {
    schema: {
      tags: ["images"],
      params: bookmarkImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const row = await getBookmarkImageRowById(id, imageId);
    if (!row) {
      throw new NotFoundError("Image", "No image");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("Image", "No image");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });

  // Serve a bookmark's screenshot bytes from object storage.
  app.get("/api/bookmarks/:id/screenshot", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getBookmarkScreenshotRow(id);
    if (!row) throw new NotFoundError("Screenshot", "No screenshot");
    const object = await getObjectStream(row.objectKey);
    if (!object) throw new NotFoundError("Screenshot", "No screenshot");
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });

  // Serve a bookmark's archived reel video. Honors HTTP Range requests (206) so `<video>` seeking
  // works; the `?v=` version param makes the bytes safe to cache immutably.
  app.get("/api/bookmarks/:id/reel-archive", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getBookmarkReelArchiveRow(id);
    if (!row) throw new NotFoundError("Reel archive", "No reel archive");

    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.header("Accept-Ranges", "bytes");

    const range = req.headers.range;
    if (range) {
      const partial = await getObjectRange(row.objectKey, range);
      if (!partial) throw new NotFoundError("Reel archive", "No reel archive");
      if (partial.contentRange) reply.header("Content-Range", partial.contentRange);
      if (partial.contentLength !== undefined) reply.header("Content-Length", partial.contentLength);
      return reply.code(206).send(partial.body);
    }

    const object = await getObjectStream(row.objectKey);
    if (!object) throw new NotFoundError("Reel archive", "No reel archive");
    if (object.contentLength !== undefined) reply.header("Content-Length", object.contentLength);
    return reply.send(object.body);
  });
}

/** Custom-property image/file value upload, removal, and download. */
function registerBookmarkPropertyFileRoutes(app: FastifyInstance): void {
  // Upload an image/file value for a bookmark's image/file custom property (multipart). Replaces any
  // existing value. Mirrors the bookmark-image upload route, keyed additionally by propertyId.
  app.post("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError("File storage is not configured");
    }
    let bytes: Buffer;
    let contentType = "application/octet-stream";
    let originalFilename: string | null = null;
    try {
      const file = await req.file();
      if (!file) {
        throw new NoFileUploadedError();
      }
      contentType = file.mimetype || contentType;
      originalFilename = file.filename || null;
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError("File is too large");
      }
      throw err;
    }
    const result = await setBookmarkPropertyFile(id, propertyId, bytes, contentType, originalFilename);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark", "Bookmark or property not found");
    }
    if (result === "wrong_type") {
      throw new AppError("Property is not an image or file type", "validation", 422);
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Remove a bookmark's image/file property value.
  app.delete("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    const removed = await removeBookmarkPropertyFile(id, propertyId);
    if (!removed) {
      throw new NotFoundError("File", "No file to delete");
    }
    return reply.code(204).send();
  });

  // Serve a bookmark's image/file property value bytes by streaming them from object storage. The URL
  // carries a `?v=` version param, so it's safe to cache immutably — a replaced value gets a new URL.
  // For non-image `file` values, a Content-Disposition header preserves the original download name.
  app.get("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    const row = await getBookmarkPropertyFileRow(id, propertyId);
    if (!row) {
      throw new NotFoundError("File", "No file");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("File", "No file");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    // Images render inline; other files download with their original name when one is known.
    if (!row.contentType.startsWith("image/") && row.originalFilename) {
      const safeName = row.originalFilename.replace(/["\\\r\n]/g, "_");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
    }
    return reply.send(object.body);
  });
}

/** CRUD routes for bookmarks, mounted under `/api/bookmarks`. */
export async function bookmarkRoutes(app: FastifyInstance): Promise<void> {
  registerBookmarkQueryRoutes(app);
  registerBookmarkBulkRoutes(app);
  registerBookmarkCrudRoutes(app);
  registerBookmarkImageRoutes(app);
  registerBookmarkRelationshipRoutes(app);
  registerBookmarkPropertyFileRoutes(app);
}
