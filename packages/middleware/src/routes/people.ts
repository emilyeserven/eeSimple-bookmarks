import type { FastifyInstance } from "fastify";
import type { CreatePersonInput, SocialMediaPlatform, UpdatePersonInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  adoptChannelImageForPerson,
  adoptWebsiteFaviconForPerson,
  fetchAndStorePersonImage,
  fetchAndStorePersonImageFromSocial,
  getPersonImageRow,
  removePersonImage,
  resolvePersonImageUrl,
  setPersonImageFromBytes,
} from "@/services/personImages";
import {
  bulkDeletePeople,
  createPerson,
  deletePerson,
  detectPersonSocialLinksFromWebsite,
  listPeople,
  personExists,
  updatePerson,
} from "@/services/people";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { AppError, ImageTooLargeError, NoFileUploadedError, NotFoundError, StorageUnconfiguredError, ValidationError } from "@/utils/errors";

const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No avatar found at that URL",
  bad_image: "Avatar couldn't be loaded",
  blocked: "Request was blocked — wait a moment and try again",
  server_error: "The URL returned a server error",
  fetch_error: "The URL couldn't be reached",
};

const personParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createPersonBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
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

const updatePersonBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
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
    websiteIds: {
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
    isFavorite: {
      type: "boolean",
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
      enum: ["website", "biography", "social"],
    },
    platform: {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
  },
} as const;

const sourcePreviewQuery = {
  type: "object",
  required: ["source"],
  additionalProperties: false,
  properties: {
    source: {
      type: "string",
      enum: ["website", "biography", "social"],
    },
    platform: {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
  },
} as const;

/** Routes for the People taxonomy, mounted under `/api/people`. */
export async function personRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/people", "people", bulkDeletePeople);

  app.get("/api/people", {
    schema: {
      tags: ["people"],
    },
  }, async () => listPeople());

  app.post("/api/people", {
    schema: {
      tags: ["people"],
      body: createPersonBody,
    },
  }, async (req, reply) => {
    const person = await createPerson(req.body as CreatePersonInput);
    return reply.code(201).send(person);
  });

  app.patch("/api/people/:id", {
    schema: {
      tags: ["people"],
      params: personParams,
      body: updatePersonBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const person = await updatePerson(id, req.body as UpdatePersonInput);
    if (!person) throw new NotFoundError("Person");
    return person;
  });

  app.delete("/api/people/:id", {
    schema: {
      tags: ["people"],
      params: personParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const imageRow = await getPersonImageRow(id);
    const deleted = await deletePerson(id);
    if (!deleted) throw new NotFoundError("Person");
    if (imageRow) await deleteObject(imageRow.objectKey).catch(() => undefined);
    return reply.code(204).send();
  });

  // Upload an avatar for an person (multipart). Replaces any existing one.
  app.post("/api/people/:id/image", {
    schema: {
      tags: ["people"],
      params: personParams,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) throw new NoFileUploadedError();
      bytes = await file.toBuffer();
    }
    catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await setPersonImageFromBytes(id, bytes);
    if (result === "not_found") throw new NotFoundError("Person");
    if (result === "bad_image") throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    return reply.code(201).send(result);
  });

  // Auto-fetch: pull an avatar from the person's stored website/biography URL, or from a connected
  // social account (Instagram). `source: "social"` requires `platform`.
  app.post("/api/people/:id/image/auto", {
    schema: {
      tags: ["people"],
      params: personParams,
      body: autoImageBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      source, platform,
    } = req.body as { source: "website" | "biography" | "social";
      platform?: SocialMediaPlatform; };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    if (source === "social" && !platform) {
      throw new ValidationError("A platform is required to fetch from a social account");
    }
    const result = source === "social"
      ? await fetchAndStorePersonImageFromSocial(id, platform!)
      : await fetchAndStorePersonImage(id, source);
    if (result === "not_found") throw new NotFoundError("Person");
    if (result === "no_url") throw new ValidationError("No URL configured for that source");
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch an avatar",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Preview the person's source avatar URL WITHOUT storing it, so the client can show the NEW avatar
  // before applying. Resolves the same candidate `POST /:id/image/auto` would grab.
  app.get("/api/people/:id/image/source-preview", {
    schema: {
      tags: ["people"],
      params: personParams,
      querystring: sourcePreviewQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      source, platform,
    } = req.query as { source: "website" | "biography" | "social";
      platform?: SocialMediaPlatform; };
    if (!(await personExists(id))) {
      throw new NotFoundError("Person");
    }
    return {
      imageUrl: await resolvePersonImageUrl(id, source, platform),
    };
  });

  // Remove an person's avatar.
  app.delete("/api/people/:id/image", {
    schema: {
      tags: ["people"],
      params: personParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removePersonImage(id);
    if (!removed) throw new NotFoundError("Avatar", "No avatar to delete");
    return reply.code(204).send();
  });

  // Serve an person's avatar bytes (immutable cache via `?v=` param).
  app.get("/api/people/:id/image", {
    schema: {
      tags: ["people"],
      params: personParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getPersonImageRow(id);
    if (!row) throw new NotFoundError("Avatar", "No avatar");
    const object = await getObjectStream(row.objectKey);
    if (!object) throw new NotFoundError("Avatar", "No avatar");
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });

  // Adopt a connected YouTube channel's stored avatar as the person's own avatar.
  app.post("/api/people/:id/image/from-channel", {
    schema: {
      tags: ["people"],
      params: personParams,
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
      throw new StorageUnconfiguredError();
    }
    const result = await adoptChannelImageForPerson(id, channelId);
    if (result === "not_found") throw new NotFoundError("Person", "Person or channel not found");
    if (result === "no_image") throw new NotFoundError("Channel", "Channel has no stored avatar");
    return reply.code(201).send(result);
  });

  // Scan the person's website for GitHub, Goodreads, and Bluesky profile links.
  app.post("/api/people/:id/social-links/detect", {
    schema: {
      tags: ["people"],
      params: personParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const result = await detectPersonSocialLinksFromWebsite(id);
    if (result === "not_found") throw new NotFoundError("Person");
    if (result === "no_url") throw new ValidationError("No website URL configured for this person");
    if (result === "fetch_error") throw new AppError("Could not fetch the person's website", "internal", 502);
    return {
      detected: result,
    };
  });

  // Adopt a connected website's stored favicon as the person's own avatar.
  app.post("/api/people/:id/image/from-website", {
    schema: {
      tags: ["people"],
      params: personParams,
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
      throw new StorageUnconfiguredError();
    }
    const result = await adoptWebsiteFaviconForPerson(id, websiteId);
    if (result === "not_found") throw new NotFoundError("Person", "Person or website not found");
    if (result === "no_image") throw new NotFoundError("Website", "Website has no stored favicon");
    return reply.code(201).send(result);
  });
}
