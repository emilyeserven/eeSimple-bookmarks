import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Button",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The secondary button variant. */
export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

/** The destructive button variant. */
export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
};

/** The outline button variant. */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

/** The small button size. */
export const Small: Story = {
  args: {
    size: "sm",
  },
};
