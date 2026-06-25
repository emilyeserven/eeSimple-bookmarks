import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkUrlResolveFeedback } from "./BookmarkUrlResolveFeedback";

const meta = {
  title: "Components/BookmarkUrlResolveFeedback",
  component: BookmarkUrlResolveFeedback,
  args: {
    error: "The server returned a 403 while following the redirect.",
  },
} satisfies Meta<typeof BookmarkUrlResolveFeedback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
