import type { FastifyInstance } from "fastify";
import type { ConnectorsStatus } from "@eesimple/types";
import { hostedMetadataEnabledAsync, hostedMetadataProviderAsync } from "@/services/hostedMetadata";
import { youtubeApiEnabled } from "@/services/youtube";
import { isObjectStoreConfigured } from "@/utils/objectStore";

/**
 * Connector status, mounted under `/api`. Reports which optional/gated metadata connectors are
 * configured so the Settings → Connectors page can show live Active/Inactive badges. Carries no
 * secrets — only booleans and the hosted provider's name — so it's safe over the unauthenticated API.
 */
export async function connectorsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/connectors", {
    schema: {
      tags: ["connectors"],
    },
  }, async (): Promise<ConnectorsStatus> => ({
    hostedMetadata: {
      enabled: await hostedMetadataEnabledAsync(),
      provider: await hostedMetadataProviderAsync(),
    },
    youtubeDataApi: {
      enabled: youtubeApiEnabled(),
    },
    objectStorage: {
      configured: isObjectStoreConfigured(),
    },
  }));
}
