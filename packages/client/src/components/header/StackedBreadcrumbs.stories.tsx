import type { BreadcrumbSegment } from "./CrumbLabel";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { StackedBreadcrumbs } from "./StackedBreadcrumbs";

const crumbs: BreadcrumbSegment[] = [
  {
    label: "Categories",
    href: "/categories",
  },
  {
    label: "Workflow",
    href: "/categories/workflow",
  },
  {
    label: "General",
  },
];

const meta = {
  title: "Components/Header/StackedBreadcrumbs",
  component: StackedBreadcrumbs,
  args: {
    crumbs,
  },
} satisfies Meta<typeof StackedBreadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A multi-level trail: a tree button reveals the ancestors, with the last crumb highlighted. */
export const Default: Story = {};

/** A single-crumb listing page — no tree button, just the current label. */
export const Single: Story = {
  args: {
    crumbs: [
      {
        label: "Bookmarks",
      },
    ],
  },
};

/** Two levels: a single tappable ancestor above the current page. */
export const TwoLevels: Story = {
  args: {
    crumbs: [
      {
        label: "Bookmarks",
        href: "/bookmarks",
      },
      {
        label: "Reading List",
      },
    ],
  },
};
