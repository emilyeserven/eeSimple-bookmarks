import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkBulkActions } from "./BookmarkBulkActions";
import { makeBookmark } from "../../test-utils/factories";
import { apiHandlers, sampleProperties } from "../../test-utils/story-mocks";

const sameCategoryBookmarks = [
  makeBookmark({
    id: "bm-1",
    categoryId: "cat-1",
  }),
  makeBookmark({
    id: "bm-2",
    categoryId: "cat-1",
  }),
  makeBookmark({
    id: "bm-3",
    categoryId: "cat-1",
  }),
];

const meta = {
  title: "Components/BookmarkBulkActions",
  component: BookmarkBulkActions,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    selectedIds: ["bm-1", "bm-2", "bm-3"],
    selectedBookmarks: sameCategoryBookmarks,
    properties: sampleProperties,
    onDone: () => {},
  },
} satisfies Meta<typeof BookmarkBulkActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The full row of bulk-action controls for the Bookmarks page (set category / media type / tags / property / delete). */
export const Default: Story = {};

/** A single bookmark selected. */
export const SingleSelected: Story = {
  args: {
    selectedIds: ["bm-1"],
    selectedBookmarks: [sameCategoryBookmarks[0]],
  },
};

/** Selected bookmarks span two different categories — the tags dialog falls back to showing every tag. */
export const MixedCategories: Story = {
  args: {
    selectedIds: ["bm-1", "bm-2"],
    selectedBookmarks: [
      makeBookmark({
        id: "bm-1",
        categoryId: "cat-1",
      }),
      makeBookmark({
        id: "bm-2",
        categoryId: "cat-2",
      }),
    ],
  },
};
