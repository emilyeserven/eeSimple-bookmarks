import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxPreFillTags } from "./InboxPreFillTags";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Components/InboxPreFillTags",
  component: InboxPreFillTags,
  args: {
    tree: sampleTagTree,
    preFill: {},
    setPreFill: () => {},
    selectedTagNames: [],
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxPreFillTags>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No tags selected — just the tree picker. */
export const Default: Story = {};

/** Two tags selected — removable badges appear above the picker. */
export const WithSelectedTags: Story = {
  args: {
    preFill: {
      tagIds: ["tag-tools", "tag-cli"],
    },
    selectedTagNames: ["tools", "cli"],
  },
};
