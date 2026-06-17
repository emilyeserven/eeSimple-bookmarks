import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { RangeSlider } from "./RangeSlider";

const meta = {
  title: "Components/RangeSlider",
  component: RangeSlider,
  args: {
    value: [2, 8] as [number, number],
    onValueChange: () => {},
  },
} satisfies Meta<typeof RangeSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [range, setRange] = useState<[number, number]>([2, 8]);
    return (
      <div className="w-64">
        <RangeSlider
          min={0}
          max={10}
          value={range}
          label="Priority"
          onValueChange={setRange}
        />
      </div>
    );
  },
};
