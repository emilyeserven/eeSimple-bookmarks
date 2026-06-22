import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet } from "@tanstack/react-router";

import { TabbedShell, navLinkClass } from "./TabbedShell";

import { Separator } from "@/components/ui/separator";
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
  /** Tab links rendered in the nav; all share `params`. */
  nav: readonly TabNavEntry[];
  /** Route params shared by every nav link (e.g. `{ websiteSlug }`). */
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
 * Shared vertical-tabbed layout shell for all slug-routed entity pages. The responsive frame lives in
 * `TabbedShell` (container-query driven); this wrapper maps the typed `nav` entries to router links
 * and renders the active child route in the body via `<Outlet/>`.
 */
export function TabbedEntityLayout({
  header, nav, params, navAriaLabel,
}: Props) {
  const navItems = nav.map((entry) => {
    if ("type" in entry && entry.type === "group") {
      return (
        <div
          key={entry.label}
          className="
            flex gap-1
            @2xl/tabs:mt-2 @2xl/tabs:flex-col
          "
        >
          <Separator
            className="
              mb-1 hidden
              @2xl/tabs:block
            "
          />
          <p
            className="
              self-center px-3 text-xs font-semibold tracking-wide
              text-muted-foreground uppercase
              @2xl/tabs:self-auto @2xl/tabs:pt-3 @2xl/tabs:pb-0.5
            "
          >
            {entry.label}
          </p>
          {entry.items.map(item => (
            <NavLink
              key={item.label}
              item={item}
              params={params}
            />
          ))}
        </div>
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
