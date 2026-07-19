import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, delay, http } from "msw";

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

const searchResult = {
  bookmarks: [
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
  ],
  total: 3,
  numberBounds: {},
};

const meta = {
  title: "Bookmarks/BookmarkSearchView",
  component: BookmarkSearchView,
  parameters: {
    msw: {
      handlers: [
        http.post("/api/bookmarks/search", () => HttpResponse.json(searchResult)),
        ...apiHandlers,
      ],
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
    search: {},
    onSearchChange: () => {},
    emptyMessage: "No bookmarks yet.",
    noMatchMessage: "No bookmarks match the current filters.",
  },
} satisfies Meta<typeof BookmarkSearchView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("/api/bookmarks/search", () => HttpResponse.json({
          bookmarks: [],
          total: 0,
          numberBounds: {},
        })),
        ...apiHandlers,
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post("/api/bookmarks/search", async () => {
          await delay("infinite");
          return HttpResponse.json(searchResult);
        }),
        ...apiHandlers,
      ],
    },
  },
};
