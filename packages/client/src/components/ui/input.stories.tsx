import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Type here…",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The disabled input with a value. */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Disabled",
  },
};

/** A number-typed input. */
export const Number: Story = {
  args: {
    type: "number",
    placeholder: "0",
  },
};
