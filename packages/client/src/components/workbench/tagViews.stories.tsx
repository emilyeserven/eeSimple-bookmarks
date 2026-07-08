import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagStatsView } from "./tagViews";
import { makeTag } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";
import { TagGeneralForm } from "../TagGeneralForm";

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
  component: TagStatsView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: tools,
  },
} satisfies Meta<typeof TagStatsView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The `stats` field's view for a tag with a parent and children. */
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
  render: () => (
    <TagGeneralForm
      node={tools}
      allTags={[tools]}
      forbiddenIds={new Set([tools.id])}
    />
  ),
};
