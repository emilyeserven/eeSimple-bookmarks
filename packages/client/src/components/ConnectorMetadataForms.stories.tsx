import type { ConnectorsAppSettings } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ArchiveBoxForm, HostedMetadataForm } from "./ConnectorMetadataForms";
import { apiHandlers } from "../test-utils/story-mocks";

const connectorsSettings: ConnectorsAppSettings = {
  hostedMetadataEndpoint: "",
  hostedMetadataProvider: "",
  hostedMetadataApiKeySet: false,
  encryptionEnabled: true,
  archiveBoxEndpoint: "",
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
