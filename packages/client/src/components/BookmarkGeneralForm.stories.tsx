import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkGeneralForm } from "./BookmarkGeneralForm";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkGeneralForm",
  component: BookmarkGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The form loaded with a bare factory bookmark (URL, title, category only). */
export const MinimalBookmark: Story = {
  args: {
    bookmark: makeBookmark({
      url: "https://example.com",
      title: "A bare bookmark",
      categoryId: "cat-workflow",
    }),
  },
};
