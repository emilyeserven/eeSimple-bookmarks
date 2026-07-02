import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChannelWebsitesField } from "./ChannelWebsitesField";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const websites: Website[] = [
  makeWebsite({
    id: "site-github",
    siteName: "GitHub",
    domain: "github.com",
    slug: "github",
  }),
  makeWebsite({
    id: "site-youtube",
    siteName: "YouTube",
    domain: "youtube.com",
    slug: "youtube",
  }),
  makeWebsite({
    id: "site-mdn",
    siteName: "MDN Web Docs",
    domain: "developer.mozilla.org",
    slug: "developer",
  }),
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
