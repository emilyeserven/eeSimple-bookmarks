import type { ConnectorsAppSettings } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ArchiveBoxForm, HostedMetadataForm, KavitaForm, PlexForm, YoutubeForm } from "./ConnectorMetadataForms";
import { apiHandlers } from "../test-utils/story-mocks";

const connectorsSettings: ConnectorsAppSettings = {
  hostedMetadataEndpoint: "",
  hostedMetadataProvider: "",
  hostedMetadataApiKeySet: false,
  encryptionEnabled: true,
  archiveBoxEndpoint: "",
  kavitaEndpoint: "",
  kavitaSidebarUrl: "",
  kavitaApiKeySet: false,
  plexEndpoint: "",
  plexTokenSet: false,
  youtubeApiKeySet: false,
  imageUrlBlacklist: [],
  useNoCookieYoutubeEmbeds: true,
};

const handlers = [
  http.get("/api/app-settings/connectors", () => HttpResponse.json(connectorsSettings)),
  ...apiHandlers,
];

const meta = {
  title: "Settings/ConnectorMetadataForms",
  component: HostedMetadataForm,
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof HostedMetadataForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The hosted-metadata (Browserless) connector form — endpoint, provider label, and API token. */
export const HostedMetadata: Story = {};

/** Hosted metadata already configured with a stored token. */
export const HostedMetadataConfigured: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          hostedMetadataEndpoint: "http://localhost:3000",
          hostedMetadataProvider: "browserless",
          hostedMetadataApiKeySet: true,
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};

/** The ArchiveBox connector form — a single base-URL field. */
export const ArchiveBox: Story = {
  render: () => <ArchiveBoxForm />,
};

/** The Kavita connector form — base URL and API key. */
export const Kavita: Story = {
  render: () => <KavitaForm />,
};

/** Kavita already configured with a stored API key. */
export const KavitaConfigured: Story = {
  render: () => <KavitaForm />,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          kavitaEndpoint: "http://localhost:5000",
          kavitaApiKeySet: true,
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};

/** The Plex connector form — base URL and token. */
export const Plex: Story = {
  render: () => <PlexForm />,
};

/** Plex already configured with a stored token. */
export const PlexConfigured: Story = {
  render: () => <PlexForm />,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          plexEndpoint: "http://localhost:32400",
          plexTokenSet: true,
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};

/** The YouTube Data API v3 connector form — a single API key field. */
export const Youtube: Story = {
  render: () => <YoutubeForm />,
};

/** YouTube already configured with a stored API key. */
export const YoutubeConfigured: Story = {
  render: () => <YoutubeForm />,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/app-settings/connectors", () => HttpResponse.json({
          ...connectorsSettings,
          youtubeApiKeySet: true,
        } satisfies ConnectorsAppSettings)),
        ...apiHandlers,
      ],
    },
  },
};
