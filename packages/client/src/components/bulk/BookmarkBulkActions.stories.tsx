import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkBulkActions } from "./BookmarkBulkActions";
import { apiHandlers, sampleProperties } from "../../test-utils/story-mocks";

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
  },
};
