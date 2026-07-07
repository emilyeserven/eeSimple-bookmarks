import type { FastifyInstance } from "fastify";
import type { CreateGroupInput, UpdateGroupInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  bulkDeleteGroups,
  createGroup,
  deleteGroup,
  getGroupBySlug,
  listGroups,
  updateGroup,
} from "@/services/groups";
import {
  fetchAndStoreGroupImage,
  fetchAndStoreGroupImageFromPlex,
  getGroupImageRow,
  removeGroupImage,
  setGroupImageFromBytes,
} from "@/services/groupImages";
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import {
  ImageTooLargeError,
  NoFileUploadedError,
  NotFoundError,
  StorageUnconfiguredError,
  UnsupportedImageError,
  ValidationError,
} from "@/utils/errors";

const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No image found for that source",
  bad_image: "Image couldn't be loaded",
  blocked: "Request was blocked — wait a moment and try again",
  server_error: "The source returned a server error",
  fetch_error: "The source couldn't be reached",
};

const uuidArraySchema = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

const groupParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const slugParams = {
  type: "object",
  required: ["slug"],
  properties: {
    slug: {
      type: "string",
    },
  },
} as const;

const createGroupBody = {
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
    groupTypeId: {
      type: ["string", "null"],
      format: "uuid",
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

const updateGroupBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...createGroupBody.properties,
    socialLinks: socialLinksSchema,
    labeledWebsites: labeledWebsitesSchema,
    sortOrder: {
      type: "integer",
    },
    year: {
      type: ["integer", "null"],
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
    albumIds: uuidArraySchema,
    youtubeChannelIds: uuidArraySchema,
    websiteIds: uuidArraySchema,
  },
} as const;

const autoImageBody = {
  type: "object",
  required: ["source"],
  additionalProperties: false,
  properties: {
    source: {
      type: "string",
      enum: ["website", "plex"],
    },
  },
} as const;

/** Routes for the Groups taxonomy, mounted under `/api/groups`. */
export async function groupRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/groups", "groups", bulkDeleteGroups);

  app.get("/api/groups", {
    schema: {
      tags: ["groups"],
    },
  }, async () => listGroups());

  app.get("/api/groups/by-slug:slug", {
    schema: {
      tags: ["groups"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const group = await getGroupBySlug(slug);
    if (!group) throw new NotFoundError("Group");
    return group;
  });

  app.post("/api/groups", {
    schema: {
      tags: ["groups"],
      body: createGroupBody,
    },
  }, async (req, reply) => {
    const group = await createGroup(req.body as CreateGroupInput);
    return reply.code(201).send(group);
  });

  app.patch("/api/groups/:id", {
    schema: {
      tags: ["groups"],
      params: groupParams,
      body: updateGroupBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const group = await updateGroup(id, req.body as UpdateGroupInput);
    if (!group) throw new NotFoundError("Group");
    return group;
  });

  app.delete("/api/groups/:id", {
    schema: {
      tags: ["groups"],
      params: groupParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteGroup(id);
    if (!deleted) throw new NotFoundError("Group");
    return reply.code(204).send();
  });

  // Upload a poster/avatar for a group (multipart). Replaces any existing one.
  app.post("/api/groups/:id/image", {
    schema: {
      tags: ["groups"],
      params: groupParams,
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
    const result = await setGroupImageFromBytes(id, bytes);
    if (result === "not_found") throw new NotFoundError("Group");
    if (result === "bad_image") throw new UnsupportedImageError();
    return reply.code(201).send(result);
  });

  // Auto-fetch: pull a poster from the group's linked website favicon or its linked Plex item.
  app.post("/api/groups/:id/image/auto", {
    schema: {
      tags: ["groups"],
      params: groupParams,
      body: autoImageBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      source,
    } = req.body as { source: "website" | "plex" };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = source === "plex"
      ? await fetchAndStoreGroupImageFromPlex(id)
      : await fetchAndStoreGroupImage(id);
    if (result === "not_found") throw new NotFoundError("Group");
    if (result === "no_url") throw new ValidationError("No source configured for that image");
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch an image",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Remove a group's poster/avatar.
  app.delete("/api/groups/:id/image", {
    schema: {
      tags: ["groups"],
      params: groupParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeGroupImage(id);
    if (!removed) throw new NotFoundError("Image", "No image to delete");
    return reply.code(204).send();
  });

  // Serve a group's poster/avatar bytes (immutable cache via `?v=` param).
  app.get("/api/groups/:id/image", {
    schema: {
      tags: ["groups"],
      params: groupParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getGroupImageRow(id);
    if (!row) throw new NotFoundError("Image", "No image");
    const object = await getObjectStream(row.objectKey);
    if (!object) throw new NotFoundError("Image", "No image");
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
