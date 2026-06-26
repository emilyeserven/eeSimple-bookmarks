import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import { TabbedShell, navLinkClass } from "./TabbedShell";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface TabNavItem {
  type?: never;
  to: LinkProps["to"];
  label: string;
}

export interface TabNavGroup {
  type: "group";
  label: string;
  items: readonly TabNavItem[];
}

export type TabNavEntry = TabNavItem | TabNavGroup;

interface Props {
  header: ReactNode;
  /** Tab links rendered in the horizontal strip; a `group` entry collapses into the "More" menu. */
  nav: readonly TabNavEntry[];
  /** Route params shared by every nav link (e.g. `{ websiteSlug }`); omitted for static routes. */
  params?: LinkProps["params"];
  navAriaLabel: string;
}

function NavLink({
  item,
  params,
}: {
  item: TabNavItem;
  params?: LinkProps["params"];
}) {
  return (
    <Link
      to={item.to}
      params={params}
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
 * A `group` entry collapsed into a single "More" dropdown button pinned at the end of the tab strip.
 * The trigger shows the active styling when the current route is one of the group's items —
 * resolved via `useMatchRoute` so it works for both parameterized (entity) and static (Settings)
 * routes (a raw `to === pathname` compare would never match a `$slug` route).
 */
function MoreMenu({
  group,
  params,
}: {
  group: TabNavGroup;
  params?: LinkProps["params"];
}) {
  const matchRoute = useMatchRoute();
  const isActive = group.items.some(item => Boolean(matchRoute({
    to: item.to,
    params,
  })));

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
            <Link
              to={item.to}
              params={params}
            >
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Shared horizontal-tabbed layout shell for all slug-routed entity pages and the Settings page. The
 * frame lives in `TabbedShell`; this wrapper maps the typed `nav` entries to router links (a `group`
 * entry collapses into a trailing "More" dropdown) and renders the active child route in the body
 * via `<Outlet/>`.
 */
export function TabbedEntityLayout({
  header, nav, params, navAriaLabel,
}: Props) {
  const navItems = nav.map((entry) => {
    if ("type" in entry && entry.type === "group") {
      return (
        <MoreMenu
          key={entry.label}
          group={entry}
          params={params}
        />
      );
    }
    return (
      <NavLink
        key={entry.label}
        item={entry}
        params={params}
      />
    );
  });

  return (
    <TabbedShell
      header={header}
      nav={navItems}
      navAriaLabel={navAriaLabel}
    >
      <Outlet />
    </TabbedShell>
  );
}
