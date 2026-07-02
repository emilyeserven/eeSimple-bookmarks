import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarCategoriesSection } from "./SidebarCategoriesSection";
import { makeCategory } from "../test-utils/factories";

import { SidebarProvider } from "@/components/ui/sidebar";

const visibleCategories = [
  makeCategory({
    id: "c1",
    name: "Recipes",
    slug: "recipes",
    icon: "ChefHat",
    bookmarkCount: 12,
  }),
  makeCategory({
    id: "c2",
    name: "Travel",
    slug: "travel",
    icon: "Plane",
    bookmarkCount: 4,
  }),
];

const seeMoreCategories = [
  makeCategory({
    id: "c3",
    name: "Archive",
    slug: "archive",
    bookmarkCount: 0,
  }),
];

const meta = {
  title: "Layout/SidebarCategoriesSection",
  component: SidebarCategoriesSection,
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: {
    visibleCategories,
    seeMoreCategories,
    expanded: false,
    setExpanded: () => {},
    pathname: "/bookmarks",
    modifier: "alt",
    sidebarState: "expanded",
    onViewClick: () => {},
  },
} satisfies Meta<typeof SidebarCategoriesSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed fold — the "See More" affordance is offered for the remaining categories. */
export const Default: Story = {};

/** Expanded fold — the folded categories are listed with a "See Less" affordance. */
export const Expanded: Story = {
  args: {
    expanded: true,
  },
};
