import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkForm } from "./BookmarkForm";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkForm",
  component: BookmarkForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
