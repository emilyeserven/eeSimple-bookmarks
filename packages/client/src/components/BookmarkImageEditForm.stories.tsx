import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkImageEditForm } from "./BookmarkImageEditForm";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkImageEditForm",
  component: BookmarkImageEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: makeBookmark({
      id: "bm-image-edit",
      url: "https://example.com/article",
      title: "An article with no image yet",
    }),
  },
} satisfies Meta<typeof BookmarkImageEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoImage: Story = {};

export const WithExistingImage: Story = {
  args: {
    bookmark: makeBookmark({
      id: "bm-image-edit-2",
      url: "https://example.com/article",
      title: "An article with an existing image",
      image: {
        id: "bm-image-edit-2-img",
        url: "https://placehold.co/600x400/png",
        width: 600,
        height: 400,
        source: "upload",
        isMain: true,
        sortOrder: 0,
      },
    }),
  },
};

export const WithScreenshot: Story = {
  args: {
    bookmark: makeBookmark({
      id: "bm-image-edit-3",
      url: "https://example.com/article",
      title: "An article with a page screenshot",
      screenshot: {
        id: "bm-image-edit-3-shot",
        url: "https://placehold.co/800x600/png",
        width: 800,
        height: 600,
        source: "screenshot",
        isMain: false,
        sortOrder: 0,
      },
    }),
  },
};
