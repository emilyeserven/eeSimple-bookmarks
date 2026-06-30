import type { Meta, StoryObj } from "@storybook/react-vite";

import { Bold } from "lucide-react";

import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  args: {
    children: "Bold",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = {
  args: {
    pressed: true,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const WithIcon: Story = {
  args: {
    "children": <Bold />,
    "aria-label": "Toggle bold",
  },
};
