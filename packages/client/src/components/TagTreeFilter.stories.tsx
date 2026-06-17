import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TagTreeFilter } from "./TagTreeFilter";
import { sampleTagTree } from "../test-utils/story-mocks";

const meta = {
  title: "Tags/TagTreeFilter",
  component: TagTreeFilter,
  args: {
    tree: sampleTagTree,
    onSelect: () => {},
  },
} satisfies Meta<typeof TagTreeFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState<string | undefined>(undefined);
    return (
      <TagTreeFilter
        tree={sampleTagTree}
        activeId={active}
        onSelect={setActive}
      />
    );
  },
};
