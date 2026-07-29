import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailDebug } from "./BookmarkDetailDebug";
import { makeBookmark } from "../test-utils/factories";
import { sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailDebug",
  component: BookmarkDetailDebug,
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkDetailDebug>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Debug JSON for a bare factory bookmark with only a title and URL. */
export const MinimalBookmark: Story = {
  args: {
    bookmark: makeBookmark({
      title: "Bare bookmark",
      url: "https://example.org",
    }),
  },
};
