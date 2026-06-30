import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkImageColumnCell } from "./bookmarkImageCell";
import { makeBookmark } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const withImage = makeBookmark({
  id: "bm-img",
  title: "A bookmark with an image",
  image: {
    id: "bm-img-image",
    url: "https://github.githubassets.com/favicons/favicon.png",
    width: 64,
    height: 64,
    source: "og",
    isMain: true,
    sortOrder: 0,
  },
});

const meta = {
  title: "Components/Tables/BookmarkImageColumnCell",
  component: BookmarkImageColumnCell,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkImageColumnCell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Cropped: Story = {
  args: {
    bookmark: withImage,
    imageMode: "cropped",
  },
};

export const Natural: Story = {
  args: {
    bookmark: withImage,
    imageMode: "natural",
  },
};

export const NoImage: Story = {
  args: {
    bookmark: makeBookmark({
      id: "bm-noimg",
      image: null,
    }),
    imageMode: "cropped",
  },
};
