import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkSearchView } from "./BookmarkSearchView";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const bookmarks = [
  sampleBookmark,
  {
    ...sampleBookmark,
    id: "bm-search-2",
    title: "A second saved bookmark",
  },
  {
    ...sampleBookmark,
    id: "bm-search-3",
    title: "A third saved bookmark",
  },
];

const meta = {
  title: "Bookmarks/BookmarkSearchView",
  component: BookmarkSearchView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    header: <h1 className="text-2xl font-semibold">Bookmarks</h1>,
    pageKey: "storybook-search",
    tree: sampleTagTree,
    properties: sampleProperties,
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    youtubeChannels: sampleChannels,
    bookmarks,
    search: {},
    onSearchChange: () => {},
    isLoading: false,
    error: null,
    emptyMessage: "No bookmarks yet.",
    noMatchMessage: "No bookmarks match the current filters.",
  },
} satisfies Meta<typeof BookmarkSearchView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    bookmarks: [],
  },
};

export const Loading: Story = {
  args: {
    bookmarks: [],
    isLoading: true,
  },
};
