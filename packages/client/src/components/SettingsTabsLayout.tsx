import type { TabNavEntry, TabNavGroup, TabNavItem } from "./TabbedEntityLayout";
import type { ReactNode } from "react";

import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { navLinkClass } from "./TabbedShell";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
  header: ReactNode;
  /** Tab links rendered in the horizontal strip; a `group` entry collapses into the "More" menu. */
  nav: readonly TabNavEntry[];
  navAriaLabel: string;
}

function NavLink({
  item,
}: {
  item: TabNavItem;
}) {
  return (
    <Link
      to={item.to}
      className={cn(navLinkClass)}
      activeProps={{
        className: "bg-accent text-accent-foreground",
      }}
    >
      {item.label}
    </Link>
  );
}

/**
 * The "More Settings" group collapsed into a single dropdown button pinned at the end of the tab
 * strip. The trigger shows the active styling when the current route is one of the group's items.
 */
function MoreMenu({
  group,
}: {
  group: TabNavGroup;
}) {
  const pathname = useRouterState({
    select: state => state.location.pathname,
  });
  const isActive = group.items.some(item => item.to === pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            navLinkClass,
            "flex items-center gap-1",
            isActive && "bg-accent text-accent-foreground",
          )}
        >
          More
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {group.items.map(item => (
          <DropdownMenuItem
            key={item.label}
            asChild
          >
            <Link to={item.to}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Settings-scoped layout: a **horizontal tab bar** (instead of the vertical sidebar used by every
 * other slug-routed entity via `TabbedShell`) with the active child route rendered below via
 * `<Outlet/>`. Top-level entries render as tabs; a `group` entry collapses into a trailing "More"
 * dropdown. Mirrors `TabbedEntityLayout`'s contract so the nav config is shared unchanged.
 */
export function SettingsTabsLayout({
  header, nav, navAriaLabel,
}: Props) {
  return (
    // Cap the width to what it was before the switch from a vertical sidebar: the old in-page nav
    // (`w-48` = 12rem) plus its `gap-6` (1.5rem) gutter. Keeps Settings from stretching edge-to-edge
    // on wide viewports now that the sidebar no longer constrains the content.
    <section className="max-w-[calc(100%-13.5rem)] space-y-6">
      {header}
      <nav
        aria-label={navAriaLabel}
        className="flex items-center gap-1 overflow-x-auto border-b pb-1"
      >
        {nav.map(entry => (
          "type" in entry && entry.type === "group"
            ? (
              <MoreMenu
                key={entry.label}
                group={entry}
              />
            )
            : (
              <NavLink
                key={entry.label}
                item={entry}
              />
            )
        ))}
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </section>
  );
}
