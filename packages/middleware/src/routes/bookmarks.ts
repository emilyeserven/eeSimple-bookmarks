import type { FastifyInstance } from "fastify";
import type { BulkBookmarkTagOp, BulkUrlUpdate, CreateBookmarkInput, UpdateBookmarkInput, UpdateBookmarkRelationshipsInput } from "@eesimple/types";
import {
  getBookmarkImageRow,
  getBookmarkImageRowById,
  getBookmarkScreenshotRow,
} from "@/services/bookmarkImages";
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
import { getObjectRange, getObjectStream } from "@/utils/objectStore";
import { isValidUrl } from "@/utils/url";
import { AppError, NotFoundError, ValidationError } from "@/utils/errors";
import { registerBookmarkImageRoutes } from "./bookmarkImageRoutes";
import { registerBookmarkPropertyFileRoutes } from "./bookmarkPropertyFileRoutes";
import { bookmarkImageParams, bookmarkParams } from "./bookmarkParamsSchema";
import {
  bulkIdsBody,
  bulkTagsBody,
  bulkUpdateBody,
  bulkUrlBody,
  createBookmarkBody,
  listQuery,
  onHostQuery,
  updateBookmarkBody,
  urlCheckQuery,
} from "./bookmarksSchema";

// Re-exported for the sections round-trip schema test (`tests/bookmarkSectionsSchema.test.ts`),
// which imports `updateBookmarkBody` from `@/routes/bookmarks`.
export { updateBookmarkBody } from "./bookmarksSchema";

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

/** CRUD routes for bookmarks, mounted under `/api/bookmarks`. */
export async function bookmarkRoutes(app: FastifyInstance): Promise<void> {
  registerBookmarkQueryRoutes(app);
  registerBookmarkBulkRoutes(app);
  registerBookmarkCrudRoutes(app);
  registerBookmarkImageRoutes(app);
  registerBookmarkRelationshipRoutes(app);
  registerBookmarkPropertyFileRoutes(app);
}
