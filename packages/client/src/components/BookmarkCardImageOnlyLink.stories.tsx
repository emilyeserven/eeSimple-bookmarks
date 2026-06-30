import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardImageOnlyLink } from "./BookmarkCardImageOnlyLink";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/BookmarkCardImageOnlyLink",
  component: BookmarkCardImageOnlyLink,
  args: {
    bookmarkId: "bookmark-github",
    children: (
      <img
        src="https://placehold.co/600x400/png"
        alt="A bookmark preview"
        className="w-full rounded-md"
      />
    ),
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkCardImageOnlyLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
