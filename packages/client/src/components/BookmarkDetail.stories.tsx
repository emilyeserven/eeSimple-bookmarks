import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetail } from "./BookmarkDetail";
import {
  apiHandlers,
  sampleBookmark,
} from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetail",
  component: BookmarkDetail,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Detail view with the Edit and Delete header actions wired. */
export const WithActions: Story = {
  args: {
    onEdit: () => {},
    onDelete: () => {},
  },
};

/** A sparse bookmark — no description, website, tags, or property values. */
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
