import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetailsPropertiesForm } from "./BookmarkDetailsPropertiesForm";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDetailsPropertiesForm",
  component: BookmarkDetailsPropertiesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
  },
} satisfies Meta<typeof BookmarkDetailsPropertiesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
