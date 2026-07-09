import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { BookmarkFilterControls } from "./BookmarkFilterControls";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

/**
 * At the default (wide) Storybook canvas the desktop `FilterPillsRow` shows; narrow the viewport
 * below `md` (768px) to see the Sort + Filter button row and the applied-filter chips.
 */
const meta = {
  title: "Filters/BookmarkFilterControls",
  component: BookmarkFilterControls,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/languages", () => HttpResponse.json([])),
        http.get("/api/language-usage-levels", () => HttpResponse.json([])),
        http.get("/api/saved-filters", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    tree: sampleTagTree,
    properties: sampleProperties,
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    youtubeChannels: sampleChannels,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof BookmarkFilterControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No filters applied. */
export const Default: Story = {};

/** With active selections — the applied chips (mobile) / filled pills (desktop) show a summary. */
export const WithSelection: Story = {
  args: {
    search: {
      categories: ["cat-workflow", "cat-content"],
      tagPresence: "missing",
    },
  },
};
