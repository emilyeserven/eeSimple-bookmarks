import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagHierarchyView } from "./tagHierarchyView";
import { makeTag } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const tools: TagNode = {
  ...makeTag({
    id: "tag-tools",
    name: "tools",
    slug: "tools",
    parentId: "tag-dev",
  }),
  children: [
    {
      ...makeTag({
        id: "tag-cli",
        name: "cli",
        slug: "cli",
        parentId: "tag-tools",
      }),
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
      ...makeTag({
        id: "tag-cli",
        name: "cli",
        slug: "cli",
        parentId: "tag-tools",
      }),
      children: [],
    },
  },
};
