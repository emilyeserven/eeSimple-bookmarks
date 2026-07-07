import type { ConnectorsAppSettings, ConnectorsStatus } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ConnectorsSettings } from "./ConnectorsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const connectorsStatus: ConnectorsStatus = {
  hostedMetadata: {
    enabled: false,
    provider: null,
    baseUrl: null,
  },
  youtubeDataApi: {
    enabled: false,
  },
  youtubeEmbed: {
    useNoCookie: true,
  },
  instagram: {
    apiKey: false,
  },
  instagramReelArchive: {
    enabled: false,
  },
  objectStorage: {
    configured: false,
  },
  archiveBox: {
    enabled: false,
    baseUrl: null,
  },
  kavita: {
    enabled: false,
    baseUrl: null,
  },
  plex: {
    enabled: false,
    baseUrl: null,
    machineIdentifier: null,
  },
  geocoding: {
    enabled: true,
    endpoint: "https://nominatim.openstreetmap.org",
  },
  wikidata: {
    enabled: true,
    endpoint: "https://www.wikidata.org",
  },
};

const connectorsSettings: ConnectorsAppSettings = {
  hostedMetadataEndpoint: "",
  hostedMetadataProvider: "",
  hostedMetadataApiKeySet: false,
  encryptionEnabled: true,
  archiveBoxEndpoint: "",
  kavitaEndpoint: "",
  kavitaApiKeySet: false,
  plexEndpoint: "",
  plexTokenSet: false,
  youtubeApiKeySet: false,
  imageUrlBlacklist: [],
  useNoCookieYoutubeEmbeds: true,
};

const meta = {
  title: "Settings/ConnectorsSettings",
  component: ConnectorsSettings,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/connectors", () => HttpResponse.json(connectorsStatus)),
        http.get("/api/app-settings/connectors", () => HttpResponse.json(connectorsSettings)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof ConnectorsSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The Tier-2 providers configured and active. */
export const ProvidersActive: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/connectors", () => HttpResponse.json({
          ...connectorsStatus,
          hostedMetadata: {
            enabled: true,
            provider: "browserless",
            baseUrl: "http://localhost:3000",
          },
          youtubeDataApi: {
            enabled: true,
          },
          archiveBox: {
            enabled: true,
            baseUrl: "http://localhost:8000",
          },
          kavita: {
            enabled: true,
            baseUrl: "http://localhost:5000",
          },
          plex: {
            enabled: true,
            baseUrl: "http://localhost:32400",
            machineIdentifier: "abc123",
          },
        } satisfies ConnectorsStatus)),
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          hostedMetadataEndpoint: "http://localhost:3000",
          hostedMetadataProvider: "browserless",
          hostedMetadataApiKeySet: true,
          archiveBoxEndpoint: "http://localhost:8000",
          kavitaEndpoint: "http://localhost:5000",
          kavitaApiKeySet: true,
          plexEndpoint: "http://localhost:32400",
          plexTokenSet: true,
          youtubeApiKeySet: true,
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};
