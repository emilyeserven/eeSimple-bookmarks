import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPropertiesForm } from "./BookmarkPropertiesForm";
import { sampleBookmark, apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkPropertiesForm",
  component: BookmarkPropertiesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkPropertiesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoCategoryProperties: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      id: "bm-no-props",
      categoryId: "cat-default",
    },
  },
};
