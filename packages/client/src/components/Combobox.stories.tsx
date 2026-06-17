import type { ComboboxOption } from "./Combobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { Code, Server, Globe } from "lucide-react";

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

const iconOptions: ComboboxOption[] = [
  {
    value: "web",
    label: "web",
    icon: <Globe className="size-4 shrink-0" />,
  },
  {
    value: "frontend",
    label: "frontend",
    icon: <Code className="size-4 shrink-0" />,
  },
  {
    value: "backend",
    label: "backend",
    icon: <Server className="size-4 shrink-0" />,
  },
];

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div className="w-64">
        <Combobox
          options={iconOptions}
          value={value}
          onValueChange={setValue}
          aria-label="Topic"
          placeholder="Select a topic…"
        />
      </div>
    );
  },
};
