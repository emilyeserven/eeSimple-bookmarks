import type { Meta, StoryObj } from "@storybook/react-vite";

import { BulkActionBar } from "./BulkActionBar";

import { Button } from "@/components/ui/button";

const meta = {
  title: "Components/BulkActionBar",
  component: BulkActionBar,
  args: {
    count: 3,
    totalSelectable: 12,
    allSelected: false,
    onSelectAll: () => {},
    onClear: () => {},
  },
} satisfies Meta<typeof BulkActionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A partial selection — the "Select all" shortcut is offered. */
export const PartialSelection: Story = {
  render: args => (
    <BulkActionBar {...args}>
      <Button
        variant="outline"
        size="sm"
      >
        Set category
      </Button>
      <Button
        variant="destructive"
        size="sm"
      >
        Delete
      </Button>
    </BulkActionBar>
  ),
};

/** Everything selected — the "Select all" shortcut is hidden. */
export const AllSelected: Story = {
  args: {
    count: 12,
    allSelected: true,
  },
  render: args => (
    <BulkActionBar {...args}>
      <Button
        variant="destructive"
        size="sm"
      >
        Delete
      </Button>
    </BulkActionBar>
  ),
};

/** Nothing selected — the bar renders nothing. */
export const Empty: Story = {
  args: {
    count: 0,
  },
};
