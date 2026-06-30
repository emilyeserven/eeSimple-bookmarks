import type { Meta, StoryObj } from "@storybook/react-vite";

import { Search } from "lucide-react";

import { Input } from "./input";
import { InputAddon, InputGroup } from "./input-group";

const meta = {
  title: "UI/InputGroup",
  component: InputGroup,
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputAddon align="inline-start">
        <Search className="size-4 text-muted-foreground" />
      </InputAddon>
      <Input
        className="ps-8"
        placeholder="Search…"
      />
    </InputGroup>
  ),
};

export const TrailingAddon: Story = {
  render: () => (
    <InputGroup className="w-72">
      <Input
        className="pe-12"
        placeholder="0"
        type="number"
      />
      <InputAddon align="inline-end">
        <span className="text-sm text-muted-foreground">px</span>
      </InputAddon>
    </InputGroup>
  ),
};
