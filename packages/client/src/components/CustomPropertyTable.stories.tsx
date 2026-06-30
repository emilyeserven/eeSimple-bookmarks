import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyTable } from "./CustomPropertyTable";
import { apiHandlers, sampleProperties } from "../test-utils/story-mocks";

/** A non-selection selection controller (selection mode off → no bulk-select column). */
const noSelection: ListSelection = {
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
};

const meta = {
  title: "Components/CustomPropertyTable",
  component: CustomPropertyTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    filtered: sampleProperties,
    selection: noSelection,
  },
} satisfies Meta<typeof CustomPropertyTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selection mode on — a leading checkbox column appears (built-in rows are not selectable). */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
