import type { Meta, StoryObj } from "@storybook/react-vite";

import { RomanizedLabel } from "./RomanizedLabel";

const meta = {
  title: "Components/RomanizedLabel",
  component: RomanizedLabel,
  args: {
    name: "東京",
    romanized: "Tokyo",
  },
} satisfies Meta<typeof RomanizedLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Primary name with its romanized form shown de-emphasized inline after it. */
export const Default: Story = {};

/** No romanized value — only the primary name renders. */
export const NoRomanized: Story = {
  args: {
    romanized: null,
  },
};

/** Stacked layout puts the secondary form on its own line below the primary. */
export const Stacked: Story = {
  args: {
    name: "サンフランシスコ",
    romanized: "San Francisco",
    stacked: true,
  },
};
