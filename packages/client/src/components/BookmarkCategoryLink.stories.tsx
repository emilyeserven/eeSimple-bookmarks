import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCategoryLink } from "./BookmarkCategoryLink";
import { sampleCategories } from "../test-utils/story-mocks";

const meta = {
  title: "Components/BookmarkCategoryLink",
  component: BookmarkCategoryLink,
  args: {
    category: sampleCategories[0],
  },
} satisfies Meta<typeof BookmarkCategoryLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SecondCategory: Story = {
  args: {
    category: sampleCategories[1] ?? sampleCategories[0],
  },
};
