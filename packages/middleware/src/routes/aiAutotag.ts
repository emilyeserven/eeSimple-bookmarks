import type { AiAutotagApplyInput } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { applyAiTags, getUntaggedBookmarks } from "@/services/aiAutotag";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 200;

const untaggedQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_LIMIT,
    },
  },
} as const;

const applyBody = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "tags"],
        properties: {
          id: {
            type: "string",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
    },
  },
} as const;

export async function aiAutotagRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/ai-autotag/untagged", {
    schema: {
      tags: ["ai-autotag"],
      querystring: untaggedQuery,
    },
  }, async (req) => {
    const {
      limit,
    } = req.query as { limit?: number };
    return getUntaggedBookmarks(limit ?? DEFAULT_LIMIT);
  });

  app.post("/api/ai-autotag/apply", {
    schema: {
      tags: ["ai-autotag"],
      body: applyBody,
    },
  }, async req => applyAiTags(req.body as AiAutotagApplyInput));
}
