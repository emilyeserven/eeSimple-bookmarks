import type { Meta, StoryObj } from "@storybook/react-vite";

import { StarRating } from "./StarRating";

const meta = {
  title: "Components/StarRating",
  component: StarRating,
  args: {
    value: 3,
    max: 5,
    onChange: () => {},
  },
} satisfies Meta<typeof StarRating>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};

export const ReadOnly: Story = {
  args: {
    value: 3.5,
    readOnly: true,
    label: "out of 5",
  },
};

export const HalfSteps: Story = {
  args: {
    value: 2.5,
    allowHalf: true,
  },
};

export const Clearable: Story = {
  args: {
    value: 4,
    allowZero: true,
  },
};
