import type { FastifyInstance } from "fastify";
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";
import {
  fetchAndStoreOgImage,
  getBookmarkImageRow,
  removeBookmarkImage,
  setBookmarkImage,
} from "@/services/bookmarkImages";
import {
  createBookmark,
  deleteBookmark,
  DuplicateUrlError,
  getBookmark,
  listBookmarks,
  listHomepageBookmarks,
  updateBookmark,
} from "@/services/bookmarks";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
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

const listQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    tag: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createBookmarkBody = {
  type: "object",
  required: ["url", "title"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
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
      },
    },
    originalUrl: {
      type: ["string", "null"],
    },
  },
} as const;

const updateBookmarkBody = {
  type: "object",
  additionalProperties: false,
  properties: createBookmarkBody.properties,
} as const;

/** CRUD routes for bookmarks, mounted under `/api/bookmarks`. */
export async function bookmarkRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/bookmarks", {
    schema: {
      tags: ["bookmarks"],
      querystring: listQuery,
    },
  }, async (req) => {
    const {
      tag,
    } = req.query as { tag?: string };
    return listBookmarks(tag);
  });

  app.get("/api/bookmarks/homepage", {
    schema: {
      tags: ["bookmarks"],
    },
  }, async () => listHomepageBookmarks());

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
    if (!isValidUrl(input.url)) {
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
      if (input.url !== undefined && !isValidUrl(input.url)) {
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
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "no_image") {
      return reply.code(502).send({
        message: "No preview image found for that page",
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
}
