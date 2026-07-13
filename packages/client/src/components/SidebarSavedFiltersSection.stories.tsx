import type { Meta, StoryObj } from "@storybook/react-vite";

import { Star } from "lucide-react";

import { SidebarSavedFiltersSection } from "./SidebarSavedFiltersSection";

import { SidebarProvider } from "@/components/ui/sidebar";

const meta = {
  title: "Layout/SidebarSavedFiltersSection",
  component: SidebarSavedFiltersSection,
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: {
    viewableFilters: [
      {
        id: "f1",
        label: "Unread articles",
        icon: <Star className="size-4" />,
        link: {
          kind: "filter",
          search: {},
        },
        bookmarkCount: 7,
        isActive: false,
        sectionId: null,
      },
      {
        id: "f2",
        label: "Videos to watch",
        icon: <Star className="size-4" />,
        link: {
          kind: "filter",
          search: {},
        },
        bookmarkCount: 3,
        isActive: true,
        sectionId: null,
      },
    ],
    sidebarState: "expanded",
  },
} satisfies Meta<typeof SidebarSavedFiltersSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
