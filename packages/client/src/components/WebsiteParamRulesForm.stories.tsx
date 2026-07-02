import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteParamRulesForm } from "./WebsiteParamRulesForm";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-youtube",
  domain: "youtube.com",
  siteName: "YouTube",
  slug: "youtube",
  builtIn: true,
  paramRules: [
    {
      pathSuffix: "/watch",
      params: ["v", "list"],
    },
  ],
  bookmarkCount: 18,
});

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
