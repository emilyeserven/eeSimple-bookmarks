import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailMedia } from "./BookmarkDetailMedia";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const withImage = makeBookmark({
  title: "An article with a hero image",
  url: "https://example.com/article",
  image: {
    id: "hero-image",
    url: "https://placehold.co/600x400/png",
    width: 600,
    height: 400,
    source: "og",
    isMain: true,
    sortOrder: 0,
  },
});

const meta = {
  title: "Bookmarks/BookmarkDetailMedia",
  component: BookmarkDetailMedia,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: withImage,
    embedUrl: null,
  },
} satisfies Meta<typeof BookmarkDetailMedia>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StaticImage: Story = {};

export const YouTubeEmbed: Story = {
  args: {
    bookmark: sampleBookmark,
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
};

export const NoMedia: Story = {
  args: {
    bookmark: makeBookmark(),
    embedUrl: null,
  },
};
