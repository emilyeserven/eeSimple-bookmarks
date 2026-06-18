import type { FastifyInstance } from "fastify";
import type { UpdateYouTubeChannelInput } from "@eesimple/types";
import {
  deleteYouTubeChannel,
  DuplicateYouTubeChannelError,
  listYouTubeChannels,
  updateYouTubeChannel,
} from "@/services/youtubeChannels";

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
    const deleted = await deleteYouTubeChannel(id);
    if (!deleted) return reply.code(404).send({
      message: "Channel not found",
    });
    return reply.code(204).send();
  });
}
