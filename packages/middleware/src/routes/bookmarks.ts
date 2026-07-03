import type { FastifyInstance } from "fastify";
import type { BulkBookmarkTagOp, BulkUrlUpdate, CreateBookmarkInput, UpdateBookmarkInput, UpdateBookmarkRelationshipsInput } from "@eesimple/types";
import {
  addBookmarkImage,
  fetchAndStoreOgImage,
  getBookmarkImageRow,
  getBookmarkImageRowById,
  getBookmarkScreenshotRow,
  removeBookmarkImage,
  removeBookmarkImageById,
  removeBookmarkScreenshot,
  setBookmarkImage,
  setMainImage,
  storeBookmarkImagesFromCandidates,
  takeAndStoreScreenshot,
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
  DuplicateUrlError,
  getBookmark,
  listBookmarks,
  listBookmarksOnHost,
  updateBookmark,
  updateBookmarkRelationships,
} from "@/services/bookmarks";
import {
  getBookmarkReelArchiveRow,
  queueReelArchive,
  removeBookmarkReelArchive,
} from "@/services/reelArchive";
import { quickSaveToInbox } from "@/services/imports";
import { importIsbnCover } from "@/services/isbn";
import { importKavitaSeriesCover, kavitaEnabledAsync } from "@/services/kavita";
import { importPlexPoster, plexEnabledAsync } from "@/services/plex";
import { getObjectRange, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { isValidUrl } from "@/utils/url";

const bookmarkParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

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

const bookmarkImageParams = {
  type: "object",
  required: ["id", "imageId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    imageId: {
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
    title: {
      type: "string",
      minLength: 1,
    },
    romanizedTitle: {
      type: ["string", "null"],
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
    locationIds: {
      type: "array",
      items: {
        type: "string",
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
                  enum: ["url", "page", "timestamp"],
                },
                startValue: {
                  type: "string",
                },
                endValue: {
                  type: "string",
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
    languageId: {
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
    groupId: {
      type: ["string", "null"],
      format: "uuid",
    },
    bookId: {
      type: ["string", "null"],
      format: "uuid",
    },
    movieId: {
      type: ["string", "null"],
      format: "uuid",
    },
    tvShowId: {
      type: ["string", "null"],
      format: "uuid",
    },
    episodeId: {
      type: ["string", "null"],
      format: "uuid",
    },
    albumId: {
      type: ["string", "null"],
      format: "uuid",
    },
    artistId: {
      type: ["string", "null"],
      format: "uuid",
    },
    trackId: {
      type: ["string", "null"],
      format: "uuid",
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
  },
} as const;

const updateBookmarkBody = {
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
    },
  }, async (req, reply) => {
    const {
      url,
    } = req.query as { url?: string };
    if (!url) return reply.code(400).send({
      message: "url is required",
    });
    return checkBookmarkUrlDuplicate(url);
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
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
    }
    const item = await quickSaveToInbox(url, title?.trim() || url);
    if (!item) {
      return reply.code(409).send({
        message: "This URL is already saved.",
      });
    }
    return reply.code(201).send(item);
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
    if (!bookmark) return reply.code(404).send({
      message: "Bookmark not found",
    });
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
      return reply.code(400).send({
        message: "url must be a valid http(s) URL",
      });
    }
    try {
      const bookmark = await createBookmark(input);
      return reply.code(201).send(bookmark);
    }
    catch (err) {
      if (err instanceof DuplicateUrlError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
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
        return reply.code(400).send({
          message: "url must be a valid http(s) URL",
        });
      }
      try {
        const bookmark = await updateBookmark(id, input);
        if (!bookmark) return reply.code(404).send({
          message: "Bookmark not found",
        });
        return bookmark;
      }
      catch (err) {
        if (err instanceof DuplicateUrlError) {
          return reply.code(409).send({
            message: err.message,
          });
        }
        throw err;
      }
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
    if (!deleted) return reply.code(404).send({
      message: "Bookmark not found",
    });
    return reply.code(204).send();
  });
}

/** Bookmark image upload, auto-capture, and removal. */
function registerBookmarkImageRoutes(app: FastifyInstance): void {
  // Upload an image for a bookmark (multipart). Replaces any existing image.
  app.post("/api/bookmarks/:id/image", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({
          message: "No file uploaded",
        });
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          message: "Image is too large",
        });
      }
      throw err;
    }
    const result = await setBookmarkImage(id, bytes, "upload");
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
    }
    return reply.code(201).send(result);
  });

  // Auto-capture: fetch the bookmark page's preview image (og:image) and store it.
  app.post("/api/bookmarks/:id/image/auto", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await fetchAndStoreOgImage(id);
    const success = typeof result !== "string";
    req.log[success ? "info" : "warn"](
      {
        bookmarkId: id,
        result: success ? "stored" : result,
      },
      success ? "[image-auto] auto-capture succeeded" : "[image-auto] auto-capture failed",
    );
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (typeof result === "string") {
      const errorMessages: Record<string, string> = {
        no_image: "No preview image found for that page",
        bad_image: "Preview image couldn't be loaded",
        blocked: "Access to this page was blocked",
        server_error: "Site returned a server error",
        fetch_error: "Page couldn't be reached",
      };
      return reply.code(502).send({
        message: errorMessages[result] ?? "Could not fetch a preview image",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Import the linked Kavita series' cover as the bookmark's main image (keeps other images).
  app.post("/api/bookmarks/:id/kavita-cover", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    if (!(await kavitaEnabledAsync())) {
      return reply.code(503).send({
        message: "Kavita is not configured",
      });
    }
    const result = await importKavitaSeriesCover(id);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "not_linked") {
      return reply.code(400).send({
        message: "Bookmark is not linked to a Kavita series",
      });
    }
    if (result === "cover_unavailable") {
      return reply.code(502).send({
        message: "Could not fetch the cover from Kavita",
      });
    }
    if (result === "too_many") {
      return reply.code(409).send({
        message: "This bookmark already has the maximum number of images",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
    }
    return reply.code(201).send(result);
  });

  // Import the linked Plex item's poster as the bookmark's main image (keeps other images).
  app.post("/api/bookmarks/:id/plex-poster", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    if (!(await plexEnabledAsync())) {
      return reply.code(503).send({
        message: "Plex is not configured",
      });
    }
    const result = await importPlexPoster(id);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "not_linked") {
      return reply.code(400).send({
        message: "Bookmark is not linked to a Plex item",
      });
    }
    if (result === "poster_unavailable") {
      return reply.code(502).send({
        message: "Could not fetch the poster from Plex",
      });
    }
    if (result === "too_many") {
      return reply.code(409).send({
        message: "This bookmark already has the maximum number of images",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
    }
    return reply.code(201).send(result);
  });

  // Import the cover from the bookmark's stored ISBN/ASIN as its main image (keeps other images).
  app.post("/api/bookmarks/:id/isbn-cover", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await importIsbnCover(id);
    if (result === "no_isbn") {
      return reply.code(400).send({
        message: "Bookmark has no ISBN/ASIN set",
      });
    }
    if (result === "isbn_not_found") {
      return reply.code(404).send({
        message: "No book found for that ISBN/ASIN",
      });
    }
    if (result === "cover_unavailable") {
      return reply.code(502).send({
        message: "Could not fetch a cover image for that ISBN/ASIN",
      });
    }
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "too_many") {
      return reply.code(409).send({
        message: "This bookmark already has the maximum number of images",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
    }
    return reply.code(201).send(result);
  });

  // Remove a bookmark's image.
  app.delete("/api/bookmarks/:id/image", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkImage(id);
    if (!removed) {
      return reply.code(404).send({
        message: "No image to delete",
      });
    }
    return reply.code(204).send();
  });

  // Add an image to a bookmark (multipart), keeping its other images. The first image (or one sent
  // with `?main=1`) becomes the main image.
  app.post("/api/bookmarks/:id/images", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          main: {
            type: "boolean",
          },
        },
      },
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      main,
    } = req.query as { main?: boolean };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({
          message: "No file uploaded",
        });
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          message: "Image is too large",
        });
      }
      throw err;
    }
    const result = await addBookmarkImage(id, bytes, "upload", {
      setMain: main === true,
    });
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "too_many") {
      return reply.code(409).send({
        message: "This bookmark already has the maximum number of images",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
    }
    return reply.code(201).send(result);
  });

  // Capture images chosen from a URL scan. SSRF-safe: the server re-derives the page's allowed
  // candidates from the bookmark's own stored URL and only stores the requested ones.
  app.post("/api/bookmarks/:id/images/from-candidates", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      body: {
        type: "object",
        required: ["urls"],
        additionalProperties: false,
        properties: {
          urls: {
            type: "array",
            items: {
              type: "string",
              format: "uri",
            },
          },
          mainUrl: {
            type: "string",
            format: "uri",
            nullable: true,
          },
        },
      } as const,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      urls, mainUrl,
    } = req.body as { urls: string[];
      mainUrl?: string | null; };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await storeBookmarkImagesFromCandidates(id, urls, mainUrl ?? null);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    return reply.code(201).send(result);
  });

  // Make one of a bookmark's images its main/primary image.
  app.post("/api/bookmarks/:id/images/:imageId/main", {
    schema: {
      tags: ["images"],
      params: bookmarkImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const result = await setMainImage(id, imageId);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Image not found",
      });
    }
    return reply.code(200).send(result);
  });

  // Remove one of a bookmark's images.
  app.delete("/api/bookmarks/:id/images/:imageId", {
    schema: {
      tags: ["images"],
      params: bookmarkImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const removed = await removeBookmarkImageById(id, imageId);
    if (!removed) {
      return reply.code(404).send({
        message: "No image to delete",
      });
    }
    return reply.code(204).send();
  });

  // Take an on-demand Browserless screenshot and store it.
  app.post("/api/bookmarks/:id/screenshot", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      body: {
        type: "object",
        properties: {
          delayMs: {
            type: "integer",
            minimum: 0,
            maximum: 30000,
          },
          width: {
            type: "integer",
            minimum: 200,
            maximum: 3840,
          },
          height: {
            type: "integer",
            minimum: 200,
            maximum: 2160,
          },
          scrollDistance: {
            type: "integer",
            minimum: 0,
            maximum: 10000,
          },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      delayMs, width, height, scrollDistance,
    } = (req.body ?? {}) as { delayMs?: number;
      width?: number;
      height?: number;
      scrollDistance?: number; };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const viewport = width != null && height != null
      ? {
        width,
        height,
      }
      : undefined;
    const result = await takeAndStoreScreenshot(id, delayMs, viewport, scrollDistance);
    if (result === "not_found") return reply.code(404).send({
      message: "Bookmark not found",
    });
    if (result === "not_configured") return reply.code(503).send({
      message: "No screenshot provider configured",
    });
    if (result === "bad_image") return reply.code(502).send({
      message: "Screenshot could not be captured",
    });
    return reply.code(201).send(result);
  });

  // Remove a bookmark's screenshot.
  app.delete("/api/bookmarks/:id/screenshot", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkScreenshot(id);
    if (!removed) return reply.code(404).send({
      message: "No screenshot to delete",
    });
    return reply.code(204).send();
  });

  // Queue a background job to archive a bookmark's Instagram reel video into object storage. Returns
  // immediately (202) with the queued job; progress surfaces in the header indicator and a toast
  // fires on completion (mirrors how imports run). The worker captures and records its own outcome.
  app.post("/api/bookmarks/:id/reel-archive", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const job = await queueReelArchive(id);
    return reply.code(202).send(job);
  });

  // Remove a bookmark's archived reel.
  app.delete("/api/bookmarks/:id/reel-archive", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkReelArchive(id);
    if (!removed) return reply.code(404).send({
      message: "No reel archive to delete",
    });
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
      return reply.code(404).send({
        message: "Bookmark not found",
      });
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
      return reply.code(404).send({
        message: "No image",
      });
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      return reply.code(404).send({
        message: "No image",
      });
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
      return reply.code(404).send({
        message: "No image",
      });
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      return reply.code(404).send({
        message: "No image",
      });
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
    if (!row) return reply.code(404).send({
      message: "No screenshot",
    });
    const object = await getObjectStream(row.objectKey);
    if (!object) return reply.code(404).send({
      message: "No screenshot",
    });
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
    if (!row) return reply.code(404).send({
      message: "No reel archive",
    });

    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    reply.header("Accept-Ranges", "bytes");

    const range = req.headers.range;
    if (range) {
      const partial = await getObjectRange(row.objectKey, range);
      if (!partial) return reply.code(404).send({
        message: "No reel archive",
      });
      if (partial.contentRange) reply.header("Content-Range", partial.contentRange);
      if (partial.contentLength !== undefined) reply.header("Content-Length", partial.contentLength);
      return reply.code(206).send(partial.body);
    }

    const object = await getObjectStream(row.objectKey);
    if (!object) return reply.code(404).send({
      message: "No reel archive",
    });
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
      return reply.code(503).send({
        message: "File storage is not configured",
      });
    }
    let bytes: Buffer;
    let contentType = "application/octet-stream";
    let originalFilename: string | null = null;
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({
          message: "No file uploaded",
        });
      }
      contentType = file.mimetype || contentType;
      originalFilename = file.filename || null;
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          message: "File is too large",
        });
      }
      throw err;
    }
    const result = await setBookmarkPropertyFile(id, propertyId, bytes, contentType, originalFilename);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark or property not found",
      });
    }
    if (result === "wrong_type") {
      return reply.code(422).send({
        message: "Property is not an image or file type",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
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
      return reply.code(404).send({
        message: "No file to delete",
      });
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
      return reply.code(404).send({
        message: "No file",
      });
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      return reply.code(404).send({
        message: "No file",
      });
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
