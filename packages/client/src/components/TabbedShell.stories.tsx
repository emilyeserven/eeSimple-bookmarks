import type { Meta, StoryObj } from "@storybook/react-vite";

import { TabbedShell, navLinkClass } from "./TabbedShell";

const NAV_TABS = ["General", "Display", "Scope"] as const;

function DemoNav({
  active = "General",
}: { active?: string }) {
  return (
    <>
      {NAV_TABS.map(tab => (
        <button
          key={tab}
          type="button"
          className={`
            ${navLinkClass}
            ${tab === active
          ? "bg-accent text-accent-foreground"
          : ""}
          `}
        >
          {tab}
        </button>
      ))}
    </>
  );
}

const meta = {
  title: "Components/TabbedShell",
  component: TabbedShell,
  args: {
    navAriaLabel: "Entity tabs",
    nav: <DemoNav />,
    children: (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Active tab content renders here.
      </div>
    ),
  },
} satisfies Meta<typeof TabbedShell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Standard multi-tab layout. */
export const Default: Story = {};

/** With an optional header above the nav strip. */
export const WithHeader: Story = {
  args: {
    header: (
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Entity Name</h1>
        <span className="text-sm text-muted-foreground">Actions here</span>
      </div>
    ),
  },
};

/**
 * When `nav` is null the strip is omitted and only the header + content render —
 * used by single-tab or tab-less detail surfaces.
 */
export const NoNav: Story = {
  args: {
    nav: null,
  },
};

/** Many tabs to demonstrate horizontal scroll when the strip overflows. */
export const ManyTabs: Story = {
  args: {
    nav: (
      <>
        {["General", "Display", "Scope", "Tags", "Categories", "Autofill", "History", "Advanced"].map(tab => (
          <button
            key={tab}
            type="button"
            className={`
              ${navLinkClass}
              ${tab === "General"
            ? "bg-accent text-accent-foreground"
            : ""}
            `}
          >
            {tab}
          </button>
        ))}
      </>
    ),
  },
};
