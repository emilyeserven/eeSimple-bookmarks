import type { ConnectorsAppSettings, ConnectorsStatus } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ConnectorsSettings } from "./ConnectorsSettings";
import { apiHandlers } from "../test-utils/story-mocks";

const connectorsStatus: ConnectorsStatus = {
  hostedMetadata: {
    enabled: false,
    provider: null,
  },
  youtubeDataApi: {
    enabled: false,
  },
  objectStorage: {
    configured: false,
  },
  archiveBox: {
    enabled: false,
    baseUrl: null,
  },
  geocoding: {
    enabled: true,
    endpoint: "https://nominatim.openstreetmap.org",
  },
};

const connectorsSettings: ConnectorsAppSettings = {
  hostedMetadataEndpoint: "",
  hostedMetadataProvider: "",
  hostedMetadataApiKeySet: false,
  encryptionEnabled: true,
  archiveBoxEndpoint: "",
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
          },
          youtubeDataApi: {
            enabled: true,
          },
          archiveBox: {
            enabled: true,
            baseUrl: "http://localhost:8000",
          },
        } satisfies ConnectorsStatus)),
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          hostedMetadataEndpoint: "http://localhost:3000",
          hostedMetadataProvider: "browserless",
          hostedMetadataApiKeySet: true,
          archiveBoxEndpoint: "http://localhost:8000",
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};
