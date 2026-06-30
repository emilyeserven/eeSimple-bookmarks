import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkListPane } from "./BookmarkListPane";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const bookmarks = [
  sampleBookmark,
  {
    ...sampleBookmark,
    id: "bm-pane-2",
    title: "A second saved bookmark",
  },
  {
    ...sampleBookmark,
    id: "bm-pane-3",
    title: "A third saved bookmark",
  },
];

const meta = {
  title: "Bookmarks/BookmarkListPane",
  component: BookmarkListPane,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    pageKey: "storybook-list-pane",
    columns: 3,
    bookmarks,
    properties: sampleProperties,
    search: {},
    isLoading: false,
    error: null,
    emptyMessage: "No bookmarks yet.",
    noMatchMessage: "No bookmarks match the current filters.",
  },
} satisfies Meta<typeof BookmarkListPane>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    bookmarks: [],
    isLoading: true,
  },
};

export const EmptyNoFilters: Story = {
  args: {
    bookmarks: [],
  },
};

export const ErrorState: Story = {
  args: {
    bookmarks: [],
    error: new Error("Failed to load bookmarks."),
  },
};
