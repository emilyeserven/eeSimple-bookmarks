import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteGeneralView } from "./websiteViews";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const github: Website = {
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  builtIn: false,
  shortenedLinks: [],
  paramRules: [],
  createdAt: NOW,
  bookmarkCount: 14,
  imageUrl: null,
  category: null,
  tagIds: [],
  mediaTypeId: "media-article",
  socialLinks: [
    {
      platform: "github",
      url: "https://github.com/github",
    },
  ],
  alternateNames: ["GH"],
};

const meta = {
  title: "Workbench/WebsiteGeneralView",
  component: WebsiteGeneralView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: github,
  },
} satisfies Meta<typeof WebsiteGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab for a website, with alternate names and a social link. */
export const Default: Story = {};

/** A built-in site with no extras. */
export const BuiltIn: Story = {
  args: {
    entity: {
      ...github,
      id: "site-youtube",
      domain: "youtube.com",
      siteName: "YouTube",
      slug: "youtube",
      builtIn: true,
      mediaTypeId: null,
      socialLinks: [],
      alternateNames: [],
    },
  },
};
