import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChannelWebsitesField } from "./ChannelWebsitesField";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeWebsite(id: string, siteName: string, domain: string): Website {
  return {
    id,
    domain,
    siteName,
    slug: domain.replace(/\..*$/, ""),
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    socialLinks: [],
    alternateNames: [],
    createdAt: NOW,
  };
}

const websites: Website[] = [
  makeWebsite("site-github", "GitHub", "github.com"),
  makeWebsite("site-youtube", "YouTube", "youtube.com"),
  makeWebsite("site-mdn", "MDN Web Docs", "developer.mozilla.org"),
];

const meta = {
  title: "Components/ChannelWebsitesField",
  component: ChannelWebsitesField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    websites,
    selectedIds: [],
    onChange: () => {},
  },
} satisfies Meta<typeof ChannelWebsitesField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Two websites already associated with the channel. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["site-github", "site-youtube"],
  },
};
