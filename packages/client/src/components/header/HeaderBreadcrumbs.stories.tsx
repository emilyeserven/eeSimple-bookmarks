import type { BreadcrumbSegment } from "./CrumbLabel";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

const meta = {
  title: "Components/Header/HeaderBreadcrumbs",
  component: HeaderBreadcrumbs,
  decorators: [Story => (
    <div className="max-w-2xl">
      <Story />
    </div>
  )],
} satisfies Meta<typeof HeaderBreadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

const detailTrail: BreadcrumbSegment[] = [
  {
    label: "Categories",
    href: "/categories",
  },
  {
    label: "Reading List",
  },
];

const editTrail: BreadcrumbSegment[] = [
  {
    label: "Categories",
    href: "/categories",
  },
  {
    label: "Reading List",
    href: "/categories/reading-list/general",
  },
  {
    label: "Edit",
  },
];

const longTrail: BreadcrumbSegment[] = [
  {
    label: "Tags",
    href: "/tags",
  },
  {
    label: "Programming",
    href: "/tags/programming",
  },
  {
    label: "Languages",
    href: "/tags/languages",
  },
  {
    label: "TypeScript",
    href: "/tags/typescript",
  },
  {
    label: "General",
  },
];

/** A detail page: `List(link) → Name`. */
export const DetailPage: Story = {
  args: {
    crumbs: detailTrail,
  },
};

/** An edit tab: `List(link) → Name(link) → Section`. */
export const EditTab: Story = {
  args: {
    crumbs: editTrail,
  },
};

/** A long trail collapses its middle crumbs into an ellipsis dropdown. */
export const LongTrailCollapsed: Story = {
  args: {
    crumbs: longTrail,
  },
};
