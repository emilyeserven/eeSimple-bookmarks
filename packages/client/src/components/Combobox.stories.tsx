import type { ComboboxOption } from "./Combobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { Combobox } from "./Combobox";

const options: ComboboxOption[] = [
  {
    value: "web",
    label: "web",
    depth: 0,
  },
  {
    value: "frontend",
    label: "frontend",
    depth: 1,
  },
  {
    value: "backend",
    label: "backend",
    depth: 1,
  },
];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  args: {
    options,
    onValueChange: () => {},
  },
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div className="w-64">
        <Combobox
          options={options}
          value={value}
          onValueChange={setValue}
          aria-label="Topic"
          placeholder="Select a topic…"
        />
      </div>
    );
  },
};
