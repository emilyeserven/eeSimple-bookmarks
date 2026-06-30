import type { Meta, StoryObj } from "@storybook/react-vite";

import { RuleTagsField } from "./RuleTagsField";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Components/RuleTagsField",
  component: RuleTagsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tagTree: sampleTagTree,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof RuleTagsField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Labelled tag picker with nothing selected. */
export const Default: Story = {};

/** A tag is pre-selected. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["tag-cli"],
  },
};
