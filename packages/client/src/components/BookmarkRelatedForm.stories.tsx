import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkRelatedForm } from "./BookmarkRelatedForm";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkRelatedForm",
  component: BookmarkRelatedForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkRelatedForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MinimalBookmark: Story = {
  args: {
    bookmark: makeBookmark({
      url: "https://example.com",
      title: "A bare bookmark",
      categoryId: "cat-workflow",
    }),
  },
};
