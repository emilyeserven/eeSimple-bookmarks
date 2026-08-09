import type { FastifyInstance } from "fastify";
import type { CollectionInsights } from "@eesimple/types";
import { getCollectionInsights } from "@/services/collectionInsights";

/** The read-only aggregate snapshot behind the client's `/insights` dashboard. */
export async function collectionInsightsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/insights", {
    schema: {
      tags: ["insights"],
    },
  }, async (): Promise<CollectionInsights> => getCollectionInsights());
}
