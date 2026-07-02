import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarCountBadge } from "./SidebarCountBadge";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";

const meta = {
  title: "Layout/SidebarCountBadge",
  component: SidebarCountBadge,
  decorators: [
    Story => (
      <SidebarProvider>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Bookmarks</SidebarMenuButton>
            <Story />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarProvider>
    ),
  ],
  args: {
    count: 42,
    sidebarState: "expanded",
  },
} satisfies Meta<typeof SidebarCountBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A null count renders nothing. */
export const NoCount: Story = {
  args: {
    count: null,
  },
};

/** Counts below `minCount` are suppressed (e.g. the Action section hides zero counts). */
export const BelowMinCount: Story = {
  args: {
    count: 0,
    minCount: 1,
  },
};
