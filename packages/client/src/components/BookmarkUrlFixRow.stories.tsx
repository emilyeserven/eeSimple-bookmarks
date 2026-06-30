import type { RedirectFailureBookmark } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkUrlFixRow } from "./BookmarkUrlFixRow";
import { apiHandlers } from "../test-utils/story-mocks";

const bookmark: RedirectFailureBookmark = {
  id: "bm-redirect",
  url: "https://t.co/shortlink",
  title: "A bookmark whose redirect could not be resolved",
  description: "Saved from a link shortener that no longer resolves cleanly.",
  imageUrl: null,
};

const meta = {
  title: "Bookmarks/BookmarkUrlFixRow",
  component: BookmarkUrlFixRow,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark,
    siteName: "Example",
    expanded: false,
    sanitizeUrl: url => url,
    onExpand: () => {},
    onCollapse: () => {},
    onFixed: () => {},
  },
} satisfies Meta<typeof BookmarkUrlFixRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The compact row with the title, current URL link, and an "Update URL" button. */
export const Collapsed: Story = {};

/** The expanded editor with the new-URL input and fetch-metadata button. */
export const Expanded: Story = {
  args: {
    expanded: true,
  },
};

/** A row whose bookmark has no stored URL. */
export const NoUrl: Story = {
  args: {
    bookmark: {
      ...bookmark,
      url: null,
    },
  },
};
