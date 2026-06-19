import type { FastifyInstance } from "fastify";
import type { UpdateYouTubeChannelInput } from "@eesimple/types";
import {
  fetchAndStoreChannelImage,
  getYouTubeChannelImageRow,
  removeYouTubeChannelImage,
} from "@/services/youtubeChannelImages";
import {
  deleteYouTubeChannel,
  DuplicateYouTubeChannelError,
  listYouTubeChannels,
  updateYouTubeChannel,
} from "@/services/youtubeChannels";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

/** User-facing messages for the typed grab failures shared by the entity-image auto routes. */
const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No avatar found for that channel",
  bad_image: "Avatar couldn't be loaded",
  blocked: "Access to the channel was blocked",
  server_error: "YouTube returned a server error",
  fetch_error: "Channel page couldn't be reached",
};

const channelParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const updateChannelBody = {
  type: "object",
  additionalProperties: false,
  properties: {
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
} as const;

/** Routes for the built-in YouTube Channels taxonomy, mounted under `/api/youtube-channels`. */
export async function youtubeChannelRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/youtube-channels", {
    schema: {
      tags: ["youtube-channels"],
    },
  }, async () => listYouTubeChannels());

  app.patch("/api/youtube-channels/:id", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
      body: updateChannelBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const channel = await updateYouTubeChannel(id, req.body as UpdateYouTubeChannelInput);
      if (!channel) return reply.code(404).send({
        message: "Channel not found",
      });
      return channel;
    }
    catch (err) {
      if (err instanceof DuplicateYouTubeChannelError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/youtube-channels/:id", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    // Read the avatar row before deleting (it cascades away with the channel), then drop its bytes
    // after a confirmed delete — its object-storage prefix isn't covered by the Gallery
    // reconciliation, so without this the object would leak. Best-effort.
    const avatarRow = await getYouTubeChannelImageRow(id);
    const deleted = await deleteYouTubeChannel(id);
    if (!deleted) return reply.code(404).send({
      message: "Channel not found",
    });
    if (avatarRow) await deleteObject(avatarRow.objectKey).catch(() => undefined);
    return reply.code(204).send();
  });

  // Auto-capture: fetch the channel's avatar (its channel-page `og:image`) and store it.
  app.post("/api/youtube-channels/:id/image/auto", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
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
    const result = await fetchAndStoreChannelImage(id);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Channel not found",
      });
    }
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch an avatar",
      });
    }
    return reply.code(201).send(result);
  });

  // Remove a channel's avatar.
  app.delete("/api/youtube-channels/:id/image", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeYouTubeChannelImage(id);
    if (!removed) {
      return reply.code(404).send({
        message: "No avatar to delete",
      });
    }
    return reply.code(204).send();
  });

  // Serve a channel's avatar bytes by streaming them from object storage. The `?v=` version param
  // makes the response safe to cache immutably — a replaced avatar gets a new URL.
  app.get("/api/youtube-channels/:id/image", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getYouTubeChannelImageRow(id);
    if (!row) {
      return reply.code(404).send({
        message: "No avatar",
      });
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      return reply.code(404).send({
        message: "No avatar",
      });
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
