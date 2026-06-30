import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagListBody } from "./TagListBody";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

const inertSelection = {
  selectedIds: [],
  selectedSet: new Set<string>(),
  isSelected: () => false,
  toggle: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 0,
  allSelected: false,
  mode: false,
  setMode: () => {},
} as unknown as ListSelection;

const meta = {
  title: "Tags/TagListBody",
  component: TagListBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree: sampleTagTree,
    selection: inertSelection,
  },
} satisfies Meta<typeof TagListBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The tag taxonomy rendered as a collapsible tree (default view mode). */
export const Default: Story = {};

/** No tags yet — the body renders nothing. */
export const Empty: Story = {
  args: {
    tree: [],
  },
};
