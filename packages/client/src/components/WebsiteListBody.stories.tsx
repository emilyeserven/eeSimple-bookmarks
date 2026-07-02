import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteListBody } from "./WebsiteListBody";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const websites: Website[] = [
  makeWebsite({
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    bookmarkCount: 42,
  }),
  makeWebsite({
    id: "site-youtube",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    bookmarkCount: 18,
  }),
  makeWebsite({
    id: "site-mdn",
    domain: "developer.mozilla.org",
    siteName: "MDN Web Docs",
    slug: "mdn",
    bookmarkCount: 0,
  }),
];

const meta = {
  title: "Components/WebsiteListBody",
  component: WebsiteListBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    filtered: websites,
  },
} satisfies Meta<typeof WebsiteListBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The card-grid body of the websites listing (the default view mode). */
export const Default: Story = {};

/** A single website row. */
export const SingleWebsite: Story = {
  args: {
    filtered: [websites[0]],
  },
};
