import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCard } from "./BookmarkCard";
import { sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkCard",
  component: BookmarkCard,
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Deletable: Story = {
  args: {
    onDelete: () => {},
  },
};

export const Plain: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      favorite: false,
      description: null,
      tags: [],
    },
  },
};
