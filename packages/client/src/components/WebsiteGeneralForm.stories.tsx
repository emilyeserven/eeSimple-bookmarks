import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteGeneralForm } from "./WebsiteGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const website: Website = {
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  builtIn: false,
  shortenedLinks: [],
  paramRules: [],
  createdAt: NOW,
  bookmarkCount: 42,
  imageUrl: null,
  category: null,
  tagIds: [],
  mediaTypeId: null,
  socialLinks: [],
  youtubeChannelIds: [],
  alternateNames: [],
  redirectResolutionFailure: false,
};

const meta = {
  title: "Components/WebsiteGeneralForm",
  component: WebsiteGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The auto-saving general edit form for a website. */
export const Default: Story = {};

/** A built-in site: the name and domain fields are fixed. */
export const BuiltIn: Story = {
  args: {
    website: {
      ...website,
      id: "site-youtube",
      domain: "youtube.com",
      siteName: "YouTube",
      slug: "youtube",
      builtIn: true,
    },
  },
};

/** With alternate names already configured. */
export const WithAlternateNames: Story = {
  args: {
    website: {
      ...website,
      alternateNames: ["GH", "GitHub Inc"],
    },
  },
};
