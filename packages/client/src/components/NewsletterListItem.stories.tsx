import type { Newsletter } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterListItem } from "./NewsletterListItem";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const newsletter: Newsletter = {
  id: "newsletter-1",
  name: "Weekly Digest",
  slug: "weekly-digest",
  createdAt: NOW,
  bookmarkCount: 8,
  category: {
    id: sampleCategories[0].id,
    name: sampleCategories[0].name,
    slug: sampleCategories[0].slug,
    icon: sampleCategories[0].icon,
  },
  tagIds: [],
  mediaTypeId: null,
};

const meta = {
  title: "Components/NewsletterListItem",
  component: NewsletterListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    newsletter,
  },
} satisfies Meta<typeof NewsletterListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single newsletter row with a category pill and hover Edit / Info buttons. */
export const Default: Story = {};

/** A newsletter with no bookmarks and no default category (zero-count, de-emphasized). */
export const NoBookmarks: Story = {
  args: {
    newsletter: {
      ...newsletter,
      name: "Unused Newsletter",
      slug: "unused-newsletter",
      bookmarkCount: 0,
      category: null,
    },
  },
};
