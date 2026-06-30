import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailTabbed } from "./BookmarkDetailTabbed";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleProperties,
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
    categories: sampleCategories,
    properties: sampleProperties,
    propertyGroups: [],
  },
} satisfies Meta<typeof BookmarkDetailTabbed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBooleanToggle: Story = {
  args: {
    onSaveBoolean: () => {},
  },
};
