import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyQuickFilterLink } from "./PropertyQuickFilterLink";

const meta = {
  title: "Components/PropertyQuickFilterLink",
  component: PropertyQuickFilterLink,
  decorators: [
    Story => (
      <div className="group flex items-center gap-2 rounded-sm border p-2">
        <span className="text-sm">Rating: 4 / 5</span>
        <Story />
      </div>
    ),
  ],
  args: {
    name: "Rating",
    search: {},
  },
} satisfies Meta<typeof PropertyQuickFilterLink>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Hidden by default — visible on parent group hover. */
export const Default: Story = {};

/** Always visible in forced-hover state (for visual testing). */
export const AlwaysVisible: Story = {
  decorators: [
    Story => (
      <div
        className="
          group flex items-center gap-2 rounded-sm border p-2
          [&_button]:opacity-100
        "
      >
        <span className="text-sm">Status: To Read</span>
        <Story />
      </div>
    ),
  ],
  args: {
    name: "Status",
  },
};
