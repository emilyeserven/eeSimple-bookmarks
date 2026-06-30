import type { Meta, StoryObj } from "@storybook/react-vite";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const meta = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  args: {
    type: "single",
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      defaultValue="center"
      variant="outline"
    >
      <ToggleGroupItem
        value="left"
        aria-label="Align left"
      >
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="center"
        aria-label="Align center"
      >
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="right"
        aria-label="Align right"
      >
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  render: () => (
    <ToggleGroup
      type="multiple"
      defaultValue={["a"]}
    >
      <ToggleGroupItem value="a">A</ToggleGroupItem>
      <ToggleGroupItem value="b">B</ToggleGroupItem>
      <ToggleGroupItem value="c">C</ToggleGroupItem>
    </ToggleGroup>
  ),
};
