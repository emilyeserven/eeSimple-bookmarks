import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorListItem } from "./AuthorListItem";
import { makeAuthor } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const author = makeAuthor({
  id: "author-1",
  name: "Jane Author",
  slug: "jane-author",
  bookmarkCount: 12,
});

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
