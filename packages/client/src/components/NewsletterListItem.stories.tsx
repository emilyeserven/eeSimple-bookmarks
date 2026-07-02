import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterListItem } from "./NewsletterListItem";
import { makeNewsletter } from "../test-utils/factories";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const newsletter = makeNewsletter({
  id: "newsletter-1",
  name: "Weekly Digest",
  slug: "weekly-digest",
  bookmarkCount: 8,
  category: {
    id: sampleCategories[0].id,
    name: sampleCategories[0].name,
    slug: sampleCategories[0].slug,
    icon: sampleCategories[0].icon,
  },
});

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
