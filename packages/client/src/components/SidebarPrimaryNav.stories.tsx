import type { ResolvedPin } from "./useSidebarPins";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Pin } from "lucide-react";

import { SidebarPrimaryNav } from "./SidebarPrimaryNav";

import { SidebarProvider } from "@/components/ui/sidebar";

const pins: ResolvedPin[] = [
  {
    id: "p1",
    label: "Reading list",
    icon: <Pin className="size-4" />,
    link: {
      kind: "filter",
      search: {},
    },
    bookmarkCount: 9,
    isActive: false,
  },
  {
    id: "p2",
    label: "Recipes",
    icon: <Pin className="size-4" />,
    link: {
      kind: "path",
      path: "/categories/recipes",
    },
    bookmarkCount: 12,
    isActive: true,
  },
];

const meta = {
  title: "Layout/SidebarPrimaryNav",
  component: SidebarPrimaryNav,
  decorators: [
    Story => (
      <SidebarProvider>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: {
    pathname: "/bookmarks",
    sidebarState: "expanded",
    inboxCount: 3,
    bookmarkCount: 128,
    resolvedPins: pins,
    pagination: {
      visiblePins: pins,
      hasShowMore: false,
      hasSeeAll: false,
      hasShowLess: false,
    },
    setPinnedExpanded: () => {},
    setPinnedShowAll: () => {},
  },
} satisfies Meta<typeof SidebarPrimaryNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** More pins than the initial fold — the "Show More" affordance appears. */
export const WithShowMore: Story = {
  args: {
    pagination: {
      visiblePins: pins.slice(0, 1),
      hasShowMore: true,
      hasSeeAll: false,
      hasShowLess: false,
    },
  },
};
