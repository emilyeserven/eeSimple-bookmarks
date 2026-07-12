import type { Meta, StoryObj } from "@storybook/react-vite";

import { RadialProgress } from "./radial-progress";

const meta = {
  title: "UI/RadialProgress",
  component: RadialProgress,
  args: {
    value: 3,
    max: 10,
    size: 48,
  },
} satisfies Meta<typeof RadialProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: 0,
    max: 10,
  },
};

export const Complete: Story = {
  args: {
    value: 10,
    max: 10,
  },
};

export const WithPercentLabel: Story = {
  args: {
    value: 3,
    max: 10,
    size: 56,
    children: <span className="text-xs font-medium">30%</span>,
  },
};
