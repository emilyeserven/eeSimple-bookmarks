import type { TagNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagGeneralForm } from "./TagGeneralForm";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const node: TagNode = sampleTagTree[0].children[0];

const meta = {
  title: "Tags/TagGeneralForm",
  component: TagGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    node,
    allTags: sampleTagTree,
    forbiddenIds: new Set<string>([node.id]),
  },
} satisfies Meta<typeof TagGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Edit a tag's name, romanized name, parent, and card toggles — each field auto-saves on blur/change. */
export const Default: Story = {};

/** A root tag with the card quick-toggle enabled. */
export const RootWithRomanized: Story = {
  args: {
    node: {
      ...sampleTagTree[0],
      editableOnCard: true,
    },
  },
};
