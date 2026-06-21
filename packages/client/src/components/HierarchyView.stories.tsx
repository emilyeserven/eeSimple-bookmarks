import type { Meta, StoryObj } from "@storybook/react-vite";

import { HierarchyView } from "./HierarchyView";

const meta = {
  title: "Components/HierarchyView",
  component: HierarchyView,
  args: {
    ancestors: [
      {
        id: "1",
        slug: "root",
        name: "Root",
      },
      {
        id: "2",
        slug: "branch",
        name: "Branch",
      },
    ],
    renderAncestorLink: ancestor => (
      <a
        href="#"
        className="hover:underline"
      >{ancestor.name}
      </a>
    ),
    hasChildren: true,
    childrenEmptyLabel: "No children.",
    childrenList: (
      <ul className="space-y-1 text-sm">
        <li>Child A</li>
        <li>Child B</li>
      </ul>
    ),
  },
} satisfies Meta<typeof HierarchyView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A root node with no ancestors. */
export const Root: Story = {
  args: {
    ancestors: [],
  },
};

/** A leaf node with no children. */
export const Leaf: Story = {
  args: {
    hasChildren: false,
    childrenList: null,
  },
};
