import type { Meta, StoryObj } from "@storybook/react-vite";

import { GateBadge } from "./GateBadge";

const meta = {
  title: "Components/GateBadge",
  component: GateBadge,
  args: {
    gate: {
      kind: "always",
    },
    live: {
      state: "on",
    },
  },
} satisfies Meta<typeof GateBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An always-on stage: the Active (default) pill. */
export const Active: Story = {};

/** A gate that is off — the Inactive outline pill, with a hover detail. */
export const Inactive: Story = {
  args: {
    gate: {
      kind: "websiteFlag",
      flag: "scanUrlForIsbn",
    },
    live: {
      state: "off",
      detail: "No website has \"Scan URL for ISBN\" on.",
    },
  },
};

/** A query-param gate the client decides per scan — the Conditional pill. */
export const Conditional: Story = {
  args: {
    gate: {
      kind: "queryParam",
      param: "resolveRedirect",
      defaultValue: true,
    },
    live: {
      state: "conditional",
      detail: "The client decides per scan (default on).",
    },
  },
};

/** A connector gate links to the Connectors settings tab. */
export const ConnectorGate: Story = {
  args: {
    gate: {
      kind: "connector",
      connector: "hostedMetadata",
    },
    live: {
      state: "off",
      detail: "Connector not configured.",
    },
  },
};
