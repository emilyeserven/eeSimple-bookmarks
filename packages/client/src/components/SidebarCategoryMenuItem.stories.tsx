import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarCategoryMenuItem } from "./SidebarCategoryMenuItem";
import { makeCategory } from "../test-utils/factories";

import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";

const meta = {
  title: "Layout/SidebarCategoryMenuItem",
  component: SidebarCategoryMenuItem,
  decorators: [
    Story => (
      <SidebarProvider>
        <SidebarMenu>
          <Story />
        </SidebarMenu>
      </SidebarProvider>
    ),
  ],
  args: {
    category: makeCategory({
      name: "Recipes",
      slug: "recipes",
      icon: "ChefHat",
      bookmarkCount: 12,
    }),
    pathname: "/bookmarks",
    modifier: "alt",
    sidebarState: "expanded",
    onViewClick: () => {},
  },
} satisfies Meta<typeof SidebarCategoryMenuItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The current route is inside this category, so the item shows its active state. */
export const Active: Story = {
  args: {
    pathname: "/categories/recipes",
  },
};
