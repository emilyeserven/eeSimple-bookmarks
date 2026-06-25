import type { FastifyInstance } from "fastify";
import { getAiSummaryQueueBookmarks, markAiQueueSummarized } from "@/services/aiSummarization";

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
}
