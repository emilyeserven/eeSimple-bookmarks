import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";

const meta = {
  title: "Components/BookmarkUrlDuplicateWarnings",
  component: BookmarkUrlDuplicateWarnings,
  args: {
    urlDuplicate: {
      exactMatch: {
        id: "bk-1",
        url: "https://example.com/article",
        title: "An Example Article",
      },
      pathMatch: null,
      identityMatches: [],
    },
  },
} satisfies Meta<typeof BookmarkUrlDuplicateWarnings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ExactMatch: Story = {};

export const PathMatch: Story = {
  args: {
    urlDuplicate: {
      exactMatch: null,
      pathMatch: {
        id: "bk-2",
        url: "https://example.com/article?ref=twitter",
        title: "An Example Article (tracked)",
      },
      identityMatches: [],
    },
  },
};

export const IdentityMatch: Story = {
  args: {
    urlDuplicate: {
      exactMatch: null,
      pathMatch: null,
      identityMatches: [{
        id: "bk-3",
        url: "https://libgen.example/book/123",
        title: "The Hitchhiker's Guide to the Galaxy",
      }],
    },
  },
};

// When the only match is the bookmark being edited, no warning shows.
export const SuppressedForCurrentBookmark: Story = {
  args: {
    currentBookmarkId: "bk-1",
  },
};
