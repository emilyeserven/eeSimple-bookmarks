import type { FastifyInstance } from "fastify";
import type { CreateGroupInput, UpdateGroupInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  bulkDeleteGroups,
  createGroup,
  deleteGroup,
  DuplicateGroupError,
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
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

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
    websiteId: {
      type: ["string", "null"],
      format: "uuid",
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
    if (!group) return reply.code(404).send({
      message: "Group not found",
    });
    return group;
  });

  app.post("/api/groups", {
    schema: {
      tags: ["groups"],
      body: createGroupBody,
    },
  }, async (req, reply) => {
    try {
      const group = await createGroup(req.body as CreateGroupInput);
      return reply.code(201).send(group);
    }
    catch (err) {
      if (err instanceof DuplicateGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/groups/:id", {
    schema: {
      tags: ["groups"],
      params: groupParams,
      body: updateGroupBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const group = await updateGroup(id, req.body as UpdateGroupInput);
      if (!group) return reply.code(404).send({
        message: "Group not found",
      });
      return group;
    }
    catch (err) {
      if (err instanceof DuplicateGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    if (!deleted) return reply.code(404).send({
      message: "Group not found",
    });
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
    const result = await setGroupImageFromBytes(id, bytes);
    if (result === "not_found") return reply.code(404).send({
      message: "Group not found",
    });
    if (result === "bad_image") return reply.code(415).send({
      message: "Unsupported or invalid image",
    });
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
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = source === "plex"
      ? await fetchAndStoreGroupImageFromPlex(id)
      : await fetchAndStoreGroupImage(id);
    if (result === "not_found") return reply.code(404).send({
      message: "Group not found",
    });
    if (result === "no_url") return reply.code(400).send({
      message: "No source configured for that image",
    });
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
    if (!removed) return reply.code(404).send({
      message: "No image to delete",
    });
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
    if (!row) return reply.code(404).send({
      message: "No image",
    });
    const object = await getObjectStream(row.objectKey);
    if (!object) return reply.code(404).send({
      message: "No image",
    });
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
