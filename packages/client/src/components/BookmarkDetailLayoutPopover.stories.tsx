import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailLayoutPopover } from "./BookmarkDetailLayoutPopover";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailLayoutPopover",
  component: BookmarkDetailLayoutPopover,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkDetailLayoutPopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
  },
};
