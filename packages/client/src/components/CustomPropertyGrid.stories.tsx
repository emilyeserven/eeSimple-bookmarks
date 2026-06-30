import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyGrid } from "./CustomPropertyGrid";
import { apiHandlers, sampleProperties } from "../test-utils/story-mocks";

/** A non-selection selection controller (selection mode off → no select overlays). */
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
  title: "Components/CustomPropertyGrid",
  component: CustomPropertyGrid,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    filtered: sampleProperties,
    allProperties: sampleProperties,
    columns: 3,
    selection: noSelection,
  },
} satisfies Meta<typeof CustomPropertyGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleColumn: Story = {
  args: {
    columns: 1,
  },
};

/** Selection mode on — non-built-in cards become selectable. */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
