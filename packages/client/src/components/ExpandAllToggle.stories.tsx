import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExpandAllToggle } from "./ExpandAllToggle";

const meta = {
  title: "Components/ExpandAllToggle",
  component: ExpandAllToggle,
  args: {
    expandableIds: ["a", "b", "c"],
    expanded: new Set<string>(),
    onExpandAll: () => {},
    onCollapseAll: () => {},
  },
} satisfies Meta<typeof ExpandAllToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing expanded yet — shows "Expand all". */
export const Collapsed: Story = {};

/** Every expandable node is open — flips to "Collapse all". */
export const AllExpanded: Story = {
  args: {
    expanded: new Set(["a", "b", "c"]),
  },
};

/** No expandable nodes — the toggle hides itself (renders nothing). */
export const Hidden: Story = {
  args: {
    expandableIds: [],
  },
};
