import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { LevelColorControl } from "./LevelColorControl";

function Controlled({
  initial = null,
}: { initial?: string | null }) {
  const [color, setColor] = useState<string | null>(initial);
  return (
    <LevelColorControl
      color={color}
      label="Country"
      onChange={setColor}
    />
  );
}

const meta = {
  title: "Components/LevelColorControl",
  component: LevelColorControl,
} satisfies Meta<typeof LevelColorControl>;

export default meta;

type Story = StoryObj;

/** No color set — shows the default-blue swatch with no reset button. */
export const Default: Story = {
  render: () => <Controlled />,
};

/** A custom color set — the trailing reset (X) clears it back to the default. */
export const WithCustomColor: Story = {
  render: () => <Controlled initial="#e11d48" />,
};
