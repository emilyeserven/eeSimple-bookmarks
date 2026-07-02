import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { LocationLevelModeToggle } from "./LocationLevelModeToggle";

const meta = {
  title: "Components/LocationLevelModeToggle",
  component: LocationLevelModeToggle,
  args: {
    value: "current",
    onChange: () => {},
  },
} satisfies Meta<typeof LocationLevelModeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Interactive — click the segments to change the level mode. */
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState<Parameters<typeof LocationLevelModeToggle>[0]["value"]>("current");
    return (
      <LocationLevelModeToggle
        value={value}
        onChange={setValue}
      />
    );
  },
};
