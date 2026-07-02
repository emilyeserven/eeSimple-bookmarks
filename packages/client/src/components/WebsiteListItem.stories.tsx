import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteListItem } from "./WebsiteListItem";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  bookmarkCount: 42,
});

const meta = {
  title: "Components/WebsiteListItem",
  component: WebsiteListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single website row with a favicon fallback, domain subtitle, count badge, and hover Edit / Info. */
export const Default: Story = {};

/** A site with no bookmarks yet (zero-count, de-emphasized). */
export const NoBookmarks: Story = {
  args: {
    website: {
      ...website,
      siteName: "Unused Site",
      slug: "unused-site",
      domain: "unused.example.com",
      bookmarkCount: 0,
    },
  },
};

/** Shown in bulk-selection mode with the row selected. */
export const Selected: Story = {
  args: {
    selectable: true,
    selected: true,
    inSelectionMode: true,
  },
};
