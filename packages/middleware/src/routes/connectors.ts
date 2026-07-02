import type { FastifyInstance } from "fastify";
import type { ConnectorsStatus } from "@eesimple/types";
import { archiveBoxBaseUrl } from "@/services/archiveBox";
import { geocodingEnabled, geocodingEndpoint } from "@/services/geocoding";
import { wikidataEnabled, wikidataEndpoint } from "@/services/wikidataGeocoding";
import { hostedMetadataEnabledAsync, hostedMetadataProviderAsync } from "@/services/hostedMetadata";
import { instagramApiEnabled } from "@/services/socialImages";
import { kavitaEnabledAsync } from "@/services/kavita";
import { getPlexMachineIdentifier, plexEnabledAsync } from "@/services/plex";
import { getActiveKavitaEndpoint, getActivePlexEndpoint } from "@/services/appSettings";
import { youtubeApiEnabledAsync } from "@/services/youtube";
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
    const storageConfigured = isObjectStoreConfigured();
    return {
      hostedMetadata: {
        enabled: await hostedMetadataEnabledAsync(),
        provider: await hostedMetadataProviderAsync(),
      },
      youtubeDataApi: {
        enabled: await youtubeApiEnabledAsync(),
      },
      instagram: {
        apiKey: instagramApiEnabled(),
      },
      instagramReelArchive: {
        // The video URL is extracted keylessly (Instagram's public embed endpoint); object storage
        // (to store the MP4) is the only hard requirement. A configured Browserless instance is an
        // optional fallback for reels the keyless embed doesn't expose.
        enabled: storageConfigured,
      },
      objectStorage: {
        configured: storageConfigured,
      },
      archiveBox: {
        enabled: Boolean(archiveUrl),
        baseUrl: archiveUrl,
      },
      kavita: {
        // Enabled requires both the base URL and the API key; the base URL alone is still returned
        // (non-secret) so the client can build series deep links.
        enabled: await kavitaEnabledAsync(),
        baseUrl: await getActiveKavitaEndpoint(),
      },
      plex: {
        // Enabled requires both the base URL and the token. The base URL and the server's
        // machineIdentifier (non-secret) are returned so the client can build item deep links; the
        // machineIdentifier is null until Plex is reachable (it's read from /identity and cached).
        enabled: await plexEnabledAsync(),
        baseUrl: await getActivePlexEndpoint(),
        machineIdentifier: await getPlexMachineIdentifier(),
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
