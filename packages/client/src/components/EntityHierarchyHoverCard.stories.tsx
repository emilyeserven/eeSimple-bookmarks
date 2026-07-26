import type { Meta, StoryObj } from "@storybook/react-vite";

import { EntityHierarchyHoverCard } from "./EntityHierarchyHoverCard";

import { Badge } from "@/components/ui/badge";

const path = [
  {
    id: "root",
    slug: "fiction",
    name: "Fiction",
  },
  {
    id: "mid",
    slug: "sci-fi",
    name: "Sci-fi",
  },
  {
    id: "leaf",
    slug: "cyberpunk",
    name: "Cyberpunk",
  },
];

const meta = {
  title: "Components/EntityHierarchyHoverCard",
  component: EntityHierarchyHoverCard,
  args: {
    path,
    renderLink: ancestor => <span className="underline">{ancestor.name}</span>,
    children: <Badge variant="secondary">Cyberpunk</Badge>,
  },
} satisfies Meta<typeof EntityHierarchyHoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Hover the pill to reveal the ancestor chain (Fiction → Sci-fi → Cyberpunk). */
export const Default: Story = {};

/** A top-level entity (no ancestors) renders its child unwrapped, with no hover card. */
export const TopLevel: Story = {
  args: {
    path: [{
      id: "leaf",
      slug: "fiction",
      name: "Fiction",
    }],
  },
};
