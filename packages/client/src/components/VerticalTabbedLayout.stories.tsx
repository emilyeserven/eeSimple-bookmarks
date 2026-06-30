import type { TabNavItem } from "./TabbedEntityLayout";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { VerticalTabbedLayout } from "./VerticalTabbedLayout";

const NAV: readonly TabNavItem[] = [
  {
    to: "/categories",
    label: "Listing",
  },
  {
    to: "/tags",
    label: "Cards",
  },
  {
    to: "/settings",
    label: "Sidebar",
  },
];

const meta = {
  title: "Components/VerticalTabbedLayout",
  component: VerticalTabbedLayout,
  args: {
    navAriaLabel: "Display settings",
    nav: NAV,
    header: (
      <div>
        <h1 className="text-xl font-semibold">Display</h1>
        <p className="text-sm text-muted-foreground">
          Configure how listings and cards look.
        </p>
      </div>
    ),
  },
} satisfies Meta<typeof VerticalTabbedLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A left-hand vertical tab rail (the Settings → Display variant); content renders via `<Outlet/>`. */
export const Default: Story = {};

/** A minimal two-tab rail. */
export const TwoTabs: Story = {
  args: {
    nav: [
      {
        to: "/categories",
        label: "Listing",
      },
      {
        to: "/tags",
        label: "Cards",
      },
    ],
  },
};
