import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailTabbed } from "./BookmarkDetailTabbed";
import {
  apiHandlers,
  sampleBookmark,
} from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailTabbed",
  component: BookmarkDetailTabbed,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkDetailTabbed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
