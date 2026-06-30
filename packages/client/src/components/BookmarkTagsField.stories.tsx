import type { Meta, StoryObj } from "@storybook/react-vite";

import { GatedTagPicker } from "./BookmarkTagsField";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/GatedTagPicker",
  component: GatedTagPicker,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    categoryId: "cat-content",
    tree: sampleTagTree,
    selectedIds: ["tag-cli"],
    onToggle: () => {},
  },
} satisfies Meta<typeof GatedTagPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Custom label + muted description above the picker. */
export const WithDescription: Story = {
  args: {
    label: "Topics",
    description: "Only this category's enabled root tags are shown.",
  },
};
