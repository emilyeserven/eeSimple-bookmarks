import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailLayoutControls } from "./BookmarkDetailLayoutControls";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailLayoutControls",
  component: BookmarkDetailLayoutControls,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkDetailLayoutControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
