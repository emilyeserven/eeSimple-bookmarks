import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkPropertySections } from "./BookmarkPropertySections";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkPropertySections",
  component: BookmarkPropertySections,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
    properties: sampleProperties,
  },
} satisfies Meta<typeof BookmarkPropertySections>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
