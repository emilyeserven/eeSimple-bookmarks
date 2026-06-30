import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddBookmarkModal } from "./AddBookmarkModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddBookmarkModal",
  component: AddBookmarkModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddBookmarkModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Add Bookmark dialog wrapping the full bookmark form, opened. */
export const Default: Story = {};

/** Pre-seeded with a URL the form starts from. */
export const WithInitialUrl: Story = {
  args: {
    initialUrl: "https://example.com/article",
  },
};
