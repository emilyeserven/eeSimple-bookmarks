import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TagPicker } from "./TagPicker";
import { sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Tags/TagPicker",
  component: TagPicker,
  args: {
    tree: sampleTagTree,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof TagPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(["tag-cli"]);
    return (
      <div className="w-64">
        <TagPicker
          tree={sampleTagTree}
          selectedIds={selected}
          onToggle={id =>
            setSelected(current =>
              (current.includes(id) ? current.filter(value => value !== id) : [...current, id]))}
        />
      </div>
    );
  },
};

export const Empty: Story = {
  args: {
    tree: [],
    selectedIds: [],
    onToggle: () => {},
  },
};
