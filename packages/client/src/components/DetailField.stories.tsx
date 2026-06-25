import type { Meta, StoryObj } from "@storybook/react-vite";

import { DetailField } from "./DetailField";

const meta = {
  title: "Components/DetailField",
  component: DetailField,
  args: {
    label: "Domain",
    children: "example.com",
  },
} satisfies Meta<typeof DetailField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RichValue: Story = {
  args: {
    label: "Tags",
    children: <span className="rounded-sm bg-muted px-2 py-0.5 text-xs">research</span>,
  },
};

// Renders nothing when the value is empty — the row is omitted entirely.
export const EmptyValueRendersNothing: Story = {
  args: {
    label: "Notes",
    children: null,
  },
};
