import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagTreeList } from "./TagTreeList";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Tags/TagTreeList",
  component: TagTreeList,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree: sampleTagTree,
    expanded: new Set<string>(),
    onToggle: () => {},
    columns: 1,
  },
} satisfies Meta<typeof TagTreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed roots; each root is its own card. */
export const Default: Story = {};

/** Roots expanded to reveal their child tags. */
export const Expanded: Story = {
  args: {
    expanded: new Set(["tag-dev", "tag-tools"]),
  },
};
