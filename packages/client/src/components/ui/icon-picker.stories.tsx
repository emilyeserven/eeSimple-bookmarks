import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { IconPicker } from "./icon-picker";

const meta = {
  title: "UI/IconPicker",
  component: IconPicker,
  args: {
    value: null,
    onChange: () => {},
  },
} satisfies Meta<typeof IconPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>("Star");
    return (
      <div className="w-64">
        <IconPicker
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="w-64">
        <IconPicker
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const PhosphorIcon: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>("ph:YinYang");
    return (
      <div className="w-64">
        <IconPicker
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const CustomIcon: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>("custom:Torii");
    return (
      <div className="w-64">
        <IconPicker
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};
