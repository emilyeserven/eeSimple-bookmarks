import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorListItem } from "./AuthorListItem";
import { apiHandlers } from "../test-utils/story-mocks";

const author: Author = {
  id: "author-1",
  name: "Jane Author",
  romanizedName: null,
  slug: "jane-author",
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 12,
  authorWebsiteUrl: null,
  biographyUrl: null,
  imageUrl: null,
  socialLinks: [],
  youtubeChannelIds: [],
  websiteIds: [],
  publisherIds: [],
};

const meta = {
  title: "Components/AuthorListItem",
  component: AuthorListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single author row with a name, bookmark count, and hover Edit / Info buttons. */
export const Default: Story = {};

/** An author with no bookmarks yet (zero-count, de-emphasized). */
export const NoBookmarks: Story = {
  args: {
    author: {
      ...author,
      name: "Unused Author",
      slug: "unused-author",
      bookmarkCount: 0,
    },
  },
};
