import type { AiSummaryApplyInput } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import { applyAiSummaries, getAiSummaryQueueBookmarks, markAiQueueSummarized } from "@/services/aiSummarization";

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
        required: ["id", "summary"],
        properties: {
          id: {
            type: "string",
          },
          summary: {
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

export async function aiSummarizationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/ai-summarization/queue", {
    schema: {
      tags: ["ai-summarization"],
    },
  }, async () => getAiSummaryQueueBookmarks());

  app.post("/api/ai-summarization/mark-summarized", {
    schema: {
      tags: ["ai-summarization"],
    },
  }, async () => markAiQueueSummarized());

  app.post("/api/ai-summarization/apply", {
    schema: {
      tags: ["ai-summarization"],
      body: applyBody,
    },
  }, async req => applyAiSummaries(req.body as AiSummaryApplyInput));
}
