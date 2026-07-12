import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Info, Pencil } from "lucide-react";

import { TaxonomyTreeRowInner } from "./TaxonomyTreeRowInner";

const node: TaxonomyTreeNode = {
  id: "t1",
  name: "Cooking",
  slug: "cooking",
  children: [
    {
      id: "t2",
      name: "Baking",
      slug: "baking",
      children: [],
    },
  ],
  builtIn: false,
  bookmarkCount: 8,
  ownBookmarkCount: 3,
};

const meta = {
  title: "Components/TaxonomyTreeRowInner",
  component: TaxonomyTreeRowInner,
  decorators: [
    Story => (
      <div className="group flex items-center gap-2 rounded-lg border px-3 py-2">
        <Story />
      </div>
    ),
  ],
  args: {
    node,
    hasChildren: true,
    isOpen: false,
    onToggle: () => {},
    renderNameLink: n => <span className="flex-1 truncate">{n.name}</span>,
    renderEditLink: () => (
      <a
        href="#edit"
        aria-label="Edit"
      >
        <Pencil className="size-4" />
      </a>
    ),
    renderInfoLink: () => (
      <a
        href="#info"
        aria-label="Info"
      >
        <Info className="size-4" />
      </a>
    ),
    filtered: false,
    chainFiltered: false,
  },
} satisfies Meta<typeof TaxonomyTreeRowInner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Expanded node with the opt-in expand-subtree and map-filter buttons (both filters active). */
export const OpenWithActions: Story = {
  args: {
    isOpen: true,
    onExpandSubtree: () => {},
    onToggleFilter: () => {},
    filtered: true,
    onToggleChainFilter: () => {},
    chainFiltered: true,
  },
};

/** A built-in leaf node — no expander, "Built-in" badge shown. */
export const BuiltInLeaf: Story = {
  args: {
    node: {
      ...node,
      builtIn: true,
      children: [],
    },
    hasChildren: false,
  },
};
