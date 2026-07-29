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

/** The editable rating with whole-star steps. */
export const Interactive: Story = {};

/** A read-only rating displaying a half value with a label. */
export const ReadOnly: Story = {
  args: {
    value: 3.5,
    readOnly: true,
    label: "out of 5",
  },
};

/** Half-star increments enabled via allowHalf. */
export const HalfSteps: Story = {
  args: {
    value: 2.5,
    allowHalf: true,
  },
};

/** allowZero lets clicking the current value clear the rating. */
export const Clearable: Story = {
  args: {
    value: 4,
    allowZero: true,
  },
};
