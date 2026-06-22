import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkTableView } from "./BookmarkTableView";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const bookmarks = [
  sampleBookmark,
  {
    ...sampleBookmark,
    id: "bm-table-2",
    title: "A second saved bookmark",
  },
  {
    ...sampleBookmark,
    id: "bm-table-3",
    title: "A third saved bookmark",
  },
];

const meta = {
  title: "Bookmarks/BookmarkTableView",
  component: BookmarkTableView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    pageKey: "storybook-bookmarks",
    bookmarks,
    properties: sampleProperties,
  },
} satisfies Meta<typeof BookmarkTableView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};
