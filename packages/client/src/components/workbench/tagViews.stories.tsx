import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagGeneralEdit, TagGeneralView } from "./tagViews";
import { makeTag } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const tools: TagNode = {
  ...makeTag({
    id: "tag-tools",
    name: "tools",
    slug: "tools",
    parentId: "tag-dev",
    bookmarkCount: 9,
    ownBookmarkCount: 3,
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
      ...makeTag({
        id: "tag-dev",
        name: "dev",
        slug: "dev",
        bookmarkCount: 12,
      }),
      children: [],
    },
  },
};

/** The General edit tab: the auto-saving tag form. */
export const Edit: StoryObj = {
  render: () => <TagGeneralEdit entity={tools} />,
};
