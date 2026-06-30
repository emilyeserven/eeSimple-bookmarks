import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagGeneralEdit, TagGeneralView } from "./tagViews";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const tools: TagNode = {
  id: "tag-tools",
  name: "tools",
  slug: "tools",
  parentId: "tag-dev",
  createdAt: NOW,
  bookmarkCount: 9,
  ownBookmarkCount: 3,
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
  title: "Workbench/TagViews",
  component: TagGeneralView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: tools,
  },
} satisfies Meta<typeof TagGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab for a tag with a parent and children. */
export const General: Story = {};

/** A root tag with no children. */
export const GeneralRoot: Story = {
  args: {
    entity: {
      id: "tag-dev",
      name: "dev",
      slug: "dev",
      parentId: null,
      createdAt: NOW,
      bookmarkCount: 12,
      children: [],
    },
  },
};

/** The General edit tab: the auto-saving tag form. */
export const Edit: StoryObj = {
  render: () => <TagGeneralEdit entity={tools} />,
};
