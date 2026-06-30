import type { TabNavEntry } from "./TabbedEntityLayout";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { TabbedEntityLayout } from "./TabbedEntityLayout";

const NAV: readonly TabNavEntry[] = [
  {
    to: "/categories",
    label: "General",
  },
  {
    to: "/tags",
    label: "Display",
  },
  {
    type: "group",
    label: "More",
    items: [
      {
        to: "/bookmarks",
        label: "Autofill",
      },
      {
        to: "/settings",
        label: "Advanced",
      },
    ],
  },
];

const meta = {
  title: "Components/TabbedEntityLayout",
  component: TabbedEntityLayout,
  args: {
    navAriaLabel: "Entity tabs",
    nav: NAV,
    header: (
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Articles</h1>
        <span className="text-sm text-muted-foreground">Edit actions</span>
      </div>
    ),
  },
} satisfies Meta<typeof TabbedEntityLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A horizontal tab strip with a trailing "More" dropdown; the active route renders via `<Outlet/>`. */
export const Default: Story = {};

/** Flat nav with no grouped "More" menu. */
export const FlatNav: Story = {
  args: {
    nav: [
      {
        to: "/categories",
        label: "General",
      },
      {
        to: "/tags",
        label: "Display",
      },
    ],
  },
};
