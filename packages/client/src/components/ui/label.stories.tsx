import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";
import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  args: {
    children: "Email",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: args => (
    <div className="space-y-1">
      <Label
        htmlFor="story-email"
        {...args}
      />
      <Input
        id="story-email"
        placeholder="you@example.com"
      />
    </div>
  ),
};
