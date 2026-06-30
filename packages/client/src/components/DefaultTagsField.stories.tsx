import type { Meta, StoryObj } from "@storybook/react-vite";

import { DefaultTagsField } from "./DefaultTagsField";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Components/DefaultTagsField",
  component: DefaultTagsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree: sampleTagTree,
    selectedIds: [],
    onToggle: () => {},
    description: "These tags are applied automatically to new bookmarks saved from this website.",
  },
} satisfies Meta<typeof DefaultTagsField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Some default tags already selected. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["tag-cli"],
  },
};
