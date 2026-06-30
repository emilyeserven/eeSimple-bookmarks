import type { HomepageContentSettings } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HomepageContentBlocks } from "./HomepageContentBlocks";
import { apiHandlers } from "../test-utils/story-mocks";

const baseContent: HomepageContentSettings = {
  homepageText: "## Welcome\n\nA few **notes** at the top of the homepage.",
  homepageTextWidth: "full",
  bookmarkQuickAddEnabled: false,
  bookmarkQuickAddWidth: "full",
  bookmarkQuickAddDisplay: "collapsible",
  homepageHeaderHidden: false,
  homepageTextEnabled: true,
};

const meta = {
  title: "Components/HomepageContentBlocks",
  component: HomepageContentBlocks,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    content: baseContent,
  },
} satisfies Meta<typeof HomepageContentBlocks>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Just the homepage Markdown text block. */
export const TextOnly: Story = {};

/** Text plus the collapsible Bookmark Quick Add. */
export const WithCollapsibleQuickAdd: Story = {
  args: {
    content: {
      ...baseContent,
      bookmarkQuickAddEnabled: true,
      bookmarkQuickAddDisplay: "collapsible",
    },
  },
};

/** Text plus the always-expanded Bookmark Quick Add form. */
export const WithExpandedQuickAdd: Story = {
  args: {
    content: {
      ...baseContent,
      bookmarkQuickAddEnabled: true,
      bookmarkQuickAddDisplay: "expanded",
    },
  },
};
