import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: {
    children: "Badge",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The secondary badge variant. */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/** The outline badge variant. */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};
