import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { ResponsivePopover } from "./responsive-popover";

/**
 * `ResponsivePopover` is a popover on wide screens and a modal `Dialog` on small screens (`<md`),
 * sharing one inner body. Resize the preview across the 768px breakpoint to see it switch.
 */
const meta = {
  title: "UI/ResponsivePopover",
  component: ResponsivePopover,
} satisfies Meta<typeof ResponsivePopover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Display",
    trigger: <Button variant="outline">Open</Button>,
    children: <p className="text-sm">Shared content — a popover here, a modal on small screens.</p>,
  },
};

export const WithDescription: Story = {
  args: {
    title: "Filters",
    description: "Choose where the filter panel appears.",
    trigger: <Button variant="outline">Filters</Button>,
    children: <p className="text-sm">Toggle group / controls go here.</p>,
  },
};
