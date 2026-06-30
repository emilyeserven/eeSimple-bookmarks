import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagHierarchyView } from "./tagHierarchyView";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const tools: TagNode = {
  id: "tag-tools",
  name: "tools",
  slug: "tools",
  parentId: "tag-dev",
  createdAt: NOW,
  children: [
    {
      id: "tag-cli",
      name: "cli",
      slug: "cli",
      parentId: "tag-tools",
      createdAt: NOW,
      children: [],
    },
  ],
};

const meta = {
  title: "Workbench/TagHierarchyView",
  component: TagHierarchyView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: tools,
  },
} satisfies Meta<typeof TagHierarchyView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A mid-tree tag: one ancestor (dev) and one child (cli). */
export const Default: Story = {};

/** A leaf tag with no children. */
export const Leaf: Story = {
  args: {
    entity: {
      id: "tag-cli",
      name: "cli",
      slug: "cli",
      parentId: "tag-tools",
      createdAt: NOW,
      children: [],
    },
  },
};
