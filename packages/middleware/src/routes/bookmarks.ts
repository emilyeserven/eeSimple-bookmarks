import type { FastifyInstance } from "fastify";
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@eesimple/types";
import {
  createBookmark,
  deleteBookmark,
  getBookmark,
  listBookmarks,
  updateBookmark,
} from "@/services/bookmarks";
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
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    propertyTagIds: {
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
    favorite: {
      type: "boolean",
    },
    pinned: {
      type: "boolean",
    },
    priority: {
      type: "integer",
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
      if (input.url !== undefined && !isValidUrl(input.url)) {
        return reply.code(400).send({
          message: "url must be a valid http(s) URL",
        });
      }
      const bookmark = await updateBookmark(id, input);
      if (!bookmark) return reply.code(404).send({
        message: "Bookmark not found",
      });
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
    if (!deleted) return reply.code(404).send({
      message: "Bookmark not found",
    });
    return reply.code(204).send();
  });
}
