import type { FastifyInstance } from "fastify";
import type { ConnectorsStatus } from "@eesimple/types";
import { archiveBoxBaseUrl } from "@/services/archiveBox";
import { getActiveHostedEndpoint } from "@/services/appSettings";
import { geocodingEnabled, geocodingEndpoint } from "@/services/geocoding";
import { wikidataEnabled, wikidataEndpoint } from "@/services/wikidataGeocoding";
import { hostedMetadataEnabledAsync, hostedMetadataProviderAsync } from "@/services/hostedMetadata";
import { instagramApiEnabled } from "@/services/socialImages";
import { youtubeApiEnabled } from "@/services/youtube";
import { isObjectStoreConfigured } from "@/utils/objectStore";

/**
 * Connector status, mounted under `/api`. Reports which optional/gated metadata connectors are
 * configured so the Settings → Connectors page can show live Active/Inactive badges. Carries no
 * secrets — only booleans, the hosted provider's name, and the (non-secret) ArchiveBox base URL the
 * client needs to build archive link-outs — so it's safe over the unauthenticated API.
 */
export async function connectorsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/connectors", {
    schema: {
      tags: ["connectors"],
    },
  }, async (): Promise<ConnectorsStatus> => {
    const archiveUrl = await archiveBoxBaseUrl();
    const browserlessEndpoint = await getActiveHostedEndpoint();
    const storageConfigured = isObjectStoreConfigured();
    return {
      hostedMetadata: {
        enabled: await hostedMetadataEnabledAsync(),
        provider: await hostedMetadataProviderAsync(),
      },
      youtubeDataApi: {
        enabled: youtubeApiEnabled(),
      },
      instagram: {
        apiKey: instagramApiEnabled(),
      },
      instagramReelArchive: {
        // Needs Browserless (to extract the video URL) AND object storage (to store the MP4).
        enabled: Boolean(browserlessEndpoint) && storageConfigured,
      },
      objectStorage: {
        configured: storageConfigured,
      },
      archiveBox: {
        enabled: Boolean(archiveUrl),
        baseUrl: archiveUrl,
      },
      geocoding: {
        enabled: geocodingEnabled(),
        endpoint: geocodingEndpoint(),
      },
      wikidata: {
        enabled: wikidataEnabled(),
        endpoint: wikidataEndpoint(),
      },
    };
  });
}
