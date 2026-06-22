import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardGrid } from "./BookmarkCardGrid";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const bookmarks = [
  sampleBookmark,
  {
    ...sampleBookmark,
    id: "bm-story-2",
    title: "A second saved bookmark",
  },
  {
    ...sampleBookmark,
    id: "bm-story-3",
    title: "A third saved bookmark",
  },
];

const meta = {
  title: "Bookmarks/BookmarkCardGrid",
  component: BookmarkCardGrid,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmarks,
    properties: sampleProperties,
    columns: 3,
  },
} satisfies Meta<typeof BookmarkCardGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ThreeColumns: Story = {};

export const SingleColumn: Story = {
  args: {
    columns: 1,
  },
};

export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};
