import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteParamRulesForm } from "./WebsiteParamRulesForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const website: Website = {
  id: "site-youtube",
  domain: "youtube.com",
  siteName: "YouTube",
  slug: "youtube",
  builtIn: true,
  shortenedLinks: [],
  paramRules: [
    {
      pathSuffix: "/watch",
      params: ["v", "list"],
    },
  ],
  createdAt: NOW,
  bookmarkCount: 18,
  imageUrl: null,
  socialLinks: [],
  alternateNames: [],
};

const meta = {
  title: "Components/WebsiteParamRulesForm",
  component: WebsiteParamRulesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteParamRulesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The auto-saving keep-param rules editor with one rule. */
export const Default: Story = {};

/** A site with no param rules yet. */
export const NoRules: Story = {
  args: {
    website: {
      ...website,
      paramRules: [],
    },
  },
};
