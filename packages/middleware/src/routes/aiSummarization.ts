import type { FastifyInstance } from "fastify";
import { markAiQueueSummarized } from "@/services/aiSummarization";

export async function aiSummarizationRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/ai-summarization/mark-summarized", {
    schema: {
      tags: ["ai-summarization"],
    },
  }, async () => markAiQueueSummarized());
}
