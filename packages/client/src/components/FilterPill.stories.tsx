import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterPill } from "./FilterPill";

const meta = {
  title: "Filters/FilterPill",
  component: FilterPill,
  args: {
    label: "Category",
    active: false,
    summary: {
      count: 0,
    },
    children: <p className="text-sm text-muted-foreground">Facet controls go here.</p>,
  },
} satisfies Meta<typeof FilterPill>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty pill — just the facet name in subtle text. Click to open its popover. */
export const Empty: Story = {};

/** Active pill — filled, with a compact selection count. */
export const ActiveCount: Story = {
  args: {
    active: true,
    summary: {
      count: 2,
    },
  },
};

/** Active pill driven by a presence mode rather than a selection count. */
export const ActivePresence: Story = {
  args: {
    label: "Website",
    active: true,
    summary: {
      count: 0,
      presence: "missing",
    },
  },
};
