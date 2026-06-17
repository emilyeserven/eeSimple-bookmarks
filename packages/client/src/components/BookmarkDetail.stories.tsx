import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetail } from "./BookmarkDetail";
import {
  sampleBookmark,
  sampleCategories,
  sampleProperties,
} from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetail",
  component: BookmarkDetail,
  args: {
    bookmark: sampleBookmark,
    categories: sampleCategories,
    properties: sampleProperties,
  },
} satisfies Meta<typeof BookmarkDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    onEdit: () => {},
    onDelete: () => {},
  },
};

export const Minimal: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      description: null,
      website: null,
      tags: [],
      numberValues: [],
      booleanValues: [],
    },
  },
};
