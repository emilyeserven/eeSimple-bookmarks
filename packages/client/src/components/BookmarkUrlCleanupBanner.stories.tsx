import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";

const meta = {
  title: "Components/BookmarkUrlCleanupBanner",
  component: BookmarkUrlCleanupBanner,
  args: {
    urlCleanup: {
      original: "https://example.com/article?utm_source=newsletter&utm_medium=email",
      applied: true,
    },
    urlShortener: {
      nudge: false,
      expandedUrl: null,
    },
    onUndo: () => {},
  },
} satisfies Meta<typeof BookmarkUrlCleanupBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortenerNudge: Story = {
  args: {
    urlCleanup: {
      original: "https://bit.ly/abc123",
      applied: true,
    },
    urlShortener: {
      nudge: true,
      expandedUrl: "https://example.com/the-real-article",
    },
  },
};

// Nothing renders until a cleanup has actually been applied.
export const NotApplied: Story = {
  args: {
    urlCleanup: null,
  },
};
