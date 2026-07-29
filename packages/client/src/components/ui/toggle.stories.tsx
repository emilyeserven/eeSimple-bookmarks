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

/** The toggle in its pressed state. */
export const Pressed: Story = {
  args: {
    pressed: true,
  },
};

/** The outline toggle variant. */
export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

/** An icon-only toggle with an aria-label. */
export const WithIcon: Story = {
  args: {
    "children": <Bold />,
    "aria-label": "Toggle bold",
  },
};
