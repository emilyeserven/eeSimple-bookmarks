import type { FastifyInstance } from "fastify";
import type { CreateYouTubeChannelInput, UpdateYouTubeChannelInput } from "@eesimple/types";
import { getChannelImageAutoFetchJobStatus, setChannelImageAutoFetchJobStatus } from "@/services/channelImageAutoFetchState";
import {
  bulkBackfillChannelImages,
  countMissingChannelImages,
  fetchAndStoreChannelImage,
  getYouTubeChannelImageRow,
  removeYouTubeChannelImage,
  resolveChannelAvatarUrl,
  setYouTubeChannelImageFromBytes,
} from "@/services/youtubeChannelImages";
import {
  bulkDeleteYouTubeChannels,
  createYouTubeChannel,
  deleteYouTubeChannel,
  DuplicateChannelKeyError,
  getYouTubeChannel,
  listYouTubeChannels,
  updateYouTubeChannel,
} from "@/services/youtubeChannels";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { AppError, ImageTooLargeError, NoFileUploadedError, NotFoundError, StorageUnconfiguredError } from "@/utils/errors";

/** User-facing messages for the typed grab failures shared by the entity-image auto routes. */
const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No avatar found for that channel",
  bad_image: "Avatar couldn't be loaded",
  blocked: "YouTube rate-limited the request — wait a moment and try again",
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
  },
} as const;

const createChannelBody = {
  type: "object",
  required: ["channelUrl", "name"],
  additionalProperties: false,
  properties: {
    channelUrl: {
      type: "string",
      minLength: 1,
    },
    name: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** Routes for the built-in YouTube Channels taxonomy, mounted under `/api/youtube-channels`. */
export async function youtubeChannelRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/youtube-channels", "youtube-channels", bulkDeleteYouTubeChannels);

  app.get("/api/youtube-channels", {
    schema: {
      tags: ["youtube-channels"],
    },
  }, async () => listYouTubeChannels());

  // Count of channels currently missing an avatar — backs the Backfill settings page so it doesn't
  // need to fetch the full channel list client-side just to display a count.
  app.get("/api/youtube-channels/missing-image-count", {
    schema: {
      tags: ["youtube-channels"],
    },
  }, async () => ({
    count: await countMissingChannelImages(),
  }));

  // Bulk backfill: start a background job that fetches avatars for every channel currently
  // missing one, batched to avoid rate-limiting. A second POST while a job is running returns 409.
  app.post("/api/youtube-channels/backfill-images", {
    schema: {
      tags: ["youtube-channels"],
    },
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    if (getChannelImageAutoFetchJobStatus().status === "running") {
      throw new AppError("A channel-image backfill job is already in progress", "conflict", 409);
    }

    setChannelImageAutoFetchJobStatus({
      status: "running",
      totalCount: 0,
      processedCount: 0,
    });
    void bulkBackfillChannelImages((processed, total) => {
      setChannelImageAutoFetchJobStatus({
        status: "running",
        totalCount: total,
        processedCount: processed,
      });
    }).then((result) => {
      setChannelImageAutoFetchJobStatus({
        status: "done",
        ...result,
      });
    }).catch(() => {
      setChannelImageAutoFetchJobStatus({
        status: "idle",
      });
    });

    return reply.code(202).send(getChannelImageAutoFetchJobStatus());
  });

  // Return the current status of the background channel-image backfill job.
  app.get("/api/youtube-channels/backfill-images/status", {
    schema: {
      tags: ["youtube-channels"],
    },
  }, async () => {
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    return getChannelImageAutoFetchJobStatus();
  });

  app.post("/api/youtube-channels", {
    schema: {
      tags: ["youtube-channels"],
      body: createChannelBody,
    },
  }, async (req, reply) => {
    try {
      const channel = await createYouTubeChannel(req.body as CreateYouTubeChannelInput);
      return reply.code(201).send(channel);
    }
    catch (err) {
      if (err instanceof DuplicateChannelKeyError) {
        return reply.code(409).send({
          message: "A channel with this URL already exists",
        });
      }
      throw err;
    }
  });

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
    const channel = await updateYouTubeChannel(id, req.body as UpdateYouTubeChannelInput);
    if (!channel) throw new NotFoundError("Channel");
    return channel;
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
    if (!deleted) throw new NotFoundError("Channel");
    if (avatarRow) await deleteObject(avatarRow.objectKey).catch(() => undefined);
    return reply.code(204).send();
  });

  // Upload an avatar for a channel (multipart). Replaces any existing one.
  app.post("/api/youtube-channels/:id/image", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
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
      if (!file) {
        throw new NoFileUploadedError();
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await setYouTubeChannelImageFromBytes(id, bytes);
    if (result === "not_found") {
      throw new NotFoundError("Channel");
    }
    if (typeof result === "object" && "code" in result) {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
        code: result.code,
        detail: result.detail,
      });
    }
    return reply.code(201).send(result);
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
      throw new StorageUnconfiguredError();
    }
    const result = await fetchAndStoreChannelImage(id);
    if (result === "not_found") {
      throw new NotFoundError("Channel");
    }
    if (typeof result === "object" && "code" in result) {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result.code] ?? "Could not fetch an avatar",
        code: result.code,
        detail: result.detail,
      });
    }
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch an avatar",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Preview the channel's source avatar URL WITHOUT storing it, so the client can show the NEW
  // avatar before applying. Resolves the same candidate `POST /:id/image/auto` would grab.
  app.get("/api/youtube-channels/:id/image/source-preview", {
    schema: {
      tags: ["youtube-channels"],
      params: channelParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const channel = await getYouTubeChannel(id);
    if (!channel) {
      throw new NotFoundError("Channel");
    }
    return {
      imageUrl: await resolveChannelAvatarUrl(id),
    };
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
      throw new NotFoundError("Avatar", "No avatar to delete");
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
      throw new NotFoundError("Avatar", "No avatar");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("Avatar", "No avatar");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
