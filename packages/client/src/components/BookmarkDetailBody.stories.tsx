import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailBody } from "./BookmarkDetailBody";
import {
  apiHandlers,
  sampleBookmark,
} from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailBody",
  component: BookmarkDetailBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkDetailBody>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Minimal: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      description: null,
      website: null,
      tags: [],
      numberValues: [],
      booleanValues: [],
    },
  },
};
