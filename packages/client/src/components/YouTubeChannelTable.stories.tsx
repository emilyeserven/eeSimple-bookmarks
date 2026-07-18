import type { ListSelection } from "../lib/useListSelection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { YouTubeChannelTable } from "./YouTubeChannelTable";
import { apiHandlers, sampleChannels } from "../test-utils/story-mocks";

/** A non-selection selection controller (selection mode off → no bulk-select column). */
const noSelection: ListSelection = {
  selectedIds: [],
  selectedSet: new Set<string>(),
  isSelected: () => false,
  toggle: () => {},
  selectRange: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 0,
  allSelected: false,
  mode: false,
  setMode: () => {},
};

const meta = {
  title: "Components/YouTubeChannelTable",
  component: YouTubeChannelTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    channels: sampleChannels,
    selection: noSelection,
  },
} satisfies Meta<typeof YouTubeChannelTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selection mode on — a leading checkbox column appears. */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    },
  },
};
