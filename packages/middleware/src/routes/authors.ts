import type { FastifyInstance } from "fastify";
import type { CreateAuthorInput, UpdateAuthorInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  adoptChannelImageForAuthor,
  adoptWebsiteFaviconForAuthor,
  fetchAndStoreAuthorImage,
  getAuthorImageRow,
  removeAuthorImage,
  setAuthorImageFromBytes,
} from "@/services/authorImages";
import {
  createAuthor,
  deleteAuthor,
  detectAuthorSocialLinksFromWebsite,
  DuplicateAuthorError,
  listAuthors,
  updateAuthor,
} from "@/services/authors";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No avatar found at that URL",
  bad_image: "Avatar couldn't be loaded",
  blocked: "Request was blocked — wait a moment and try again",
  server_error: "The URL returned a server error",
  fetch_error: "The URL couldn't be reached",
};

const authorParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createAuthorBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    romanizedName: {
      type: ["string", "null"],
    },
  },
} as const;

const socialLinksSchema = {
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

const updateAuthorBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    romanizedName: {
      type: ["string", "null"],
    },
    authorWebsiteUrl: {
      type: ["string", "null"],
    },
    biographyUrl: {
      type: ["string", "null"],
    },
    socialLinks: socialLinksSchema,
    youtubeChannelIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    websiteIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    publisherIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

const autoImageBody = {
  type: "object",
  required: ["source"],
  additionalProperties: false,
  properties: {
    source: {
      type: "string",
      enum: ["website", "biography"],
    },
  },
} as const;

/** Routes for the Authors taxonomy, mounted under `/api/authors`. */
export async function authorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/authors", {
    schema: {
      tags: ["authors"],
    },
  }, async () => listAuthors());

  app.post("/api/authors", {
    schema: {
      tags: ["authors"],
      body: createAuthorBody,
    },
  }, async (req, reply) => {
    try {
      const author = await createAuthor(req.body as CreateAuthorInput);
      return reply.code(201).send(author);
    }
    catch (err) {
      if (err instanceof DuplicateAuthorError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/authors/:id", {
    schema: {
      tags: ["authors"],
      params: authorParams,
      body: updateAuthorBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const author = await updateAuthor(id, req.body as UpdateAuthorInput);
      if (!author) return reply.code(404).send({
        message: "Author not found",
      });
      return author;
    }
    catch (err) {
      if (err instanceof DuplicateAuthorError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/authors/:id", {
    schema: {
      tags: ["authors"],
      params: authorParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const imageRow = await getAuthorImageRow(id);
    const deleted = await deleteAuthor(id);
    if (!deleted) return reply.code(404).send({
      message: "Author not found",
    });
    if (imageRow) await deleteObject(imageRow.objectKey).catch(() => undefined);
    return reply.code(204).send();
  });

  // Upload an avatar for an author (multipart). Replaces any existing one.
  app.post("/api/authors/:id/image", {
    schema: {
      tags: ["authors"],
      params: authorParams,
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
      if (!file) return reply.code(400).send({
        message: "No file uploaded",
      });
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
    const result = await setAuthorImageFromBytes(id, bytes);
    if (result === "not_found") return reply.code(404).send({
      message: "Author not found",
    });
    if (result === "bad_image") return reply.code(415).send({
      message: "Unsupported or invalid image",
    });
    return reply.code(201).send(result);
  });

  // Auto-fetch: pull an og:image from the author's stored website or biography URL.
  app.post("/api/authors/:id/image/auto", {
    schema: {
      tags: ["authors"],
      params: authorParams,
      body: autoImageBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      source,
    } = req.body as { source: "website" | "biography" };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await fetchAndStoreAuthorImage(id, source);
    if (result === "not_found") return reply.code(404).send({
      message: "Author not found",
    });
    if (result === "no_url") return reply.code(400).send({
      message: "No URL configured for that source",
    });
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch an avatar",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Remove an author's avatar.
  app.delete("/api/authors/:id/image", {
    schema: {
      tags: ["authors"],
      params: authorParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeAuthorImage(id);
    if (!removed) return reply.code(404).send({
      message: "No avatar to delete",
    });
    return reply.code(204).send();
  });

  // Serve an author's avatar bytes (immutable cache via `?v=` param).
  app.get("/api/authors/:id/image", {
    schema: {
      tags: ["authors"],
      params: authorParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getAuthorImageRow(id);
    if (!row) return reply.code(404).send({
      message: "No avatar",
    });
    const object = await getObjectStream(row.objectKey);
    if (!object) return reply.code(404).send({
      message: "No avatar",
    });
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });

  // Adopt a connected YouTube channel's stored avatar as the author's own avatar.
  app.post("/api/authors/:id/image/from-channel", {
    schema: {
      tags: ["authors"],
      params: authorParams,
      body: {
        type: "object",
        required: ["channelId"],
        additionalProperties: false,
        properties: {
          channelId: {
            type: "string",
            format: "uuid",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      channelId,
    } = req.body as { channelId: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await adoptChannelImageForAuthor(id, channelId);
    if (result === "not_found") return reply.code(404).send({
      message: "Author or channel not found",
    });
    if (result === "no_image") return reply.code(404).send({
      message: "Channel has no stored avatar",
    });
    return reply.code(201).send(result);
  });

  // Scan the author's website for GitHub, Goodreads, and Bluesky profile links.
  app.post("/api/authors/:id/social-links/detect", {
    schema: {
      tags: ["authors"],
      params: authorParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const result = await detectAuthorSocialLinksFromWebsite(id);
    if (result === "not_found") return reply.code(404).send({
      message: "Author not found",
    });
    if (result === "no_url") return reply.code(400).send({
      message: "No website URL configured for this author",
    });
    if (result === "fetch_error") return reply.code(502).send({
      message: "Could not fetch the author's website",
    });
    return {
      detected: result,
    };
  });

  // Adopt a connected website's stored favicon as the author's own avatar.
  app.post("/api/authors/:id/image/from-website", {
    schema: {
      tags: ["authors"],
      params: authorParams,
      body: {
        type: "object",
        required: ["websiteId"],
        additionalProperties: false,
        properties: {
          websiteId: {
            type: "string",
            format: "uuid",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      websiteId,
    } = req.body as { websiteId: string };
    if (!isObjectStoreConfigured()) {
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await adoptWebsiteFaviconForAuthor(id, websiteId);
    if (result === "not_found") return reply.code(404).send({
      message: "Author or website not found",
    });
    if (result === "no_image") return reply.code(404).send({
      message: "Website has no stored favicon",
    });
    return reply.code(201).send(result);
  });
}
