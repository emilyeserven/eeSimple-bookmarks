import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet } from "@tanstack/react-router";

import { TabbedShell, navLinkClass } from "./TabbedShell";

import { cn } from "@/lib/utils";

export interface ListingHubTab {
  to: LinkProps["to"];
  label: string;
  /** Match only the exact path (the bookmarks/index tab, so it isn't active on gallery/media/info). */
  exact?: boolean;
}

interface Props {
  /** Entity heading rendered above the tab strip (shared by every hub tab, including Info). */
  header: ReactNode;
  /** The horizontal outer tabs — `Bookmarks | Gallery | Media | Info` for a listing entity. */
  tabs: readonly ListingHubTab[];
  /** Route params shared by every tab link (e.g. `{ categorySlug }`). */
  params: LinkProps["params"];
  navAriaLabel: string;
}

/**
 * The listing entity's outer shell: the entity `<h1>` header over a horizontal tab strip
 * (`Bookmarks | Gallery | Media | Info`) and the active child route via `<Outlet/>`. The first three
 * tabs are `BookmarkSearchView` panes sharing the filter sidebar; **Info** navigates to the vertical
 * {@link import("./workbench/EntityInfoView").EntityInfoView}. Rendered by each entity's pathless `_hub`
 * layout so the strip + header appear on every listing view but never on the separate `edit` pages.
 * Distinct from {@link TabbedEntityLayout} in that it supports `exact` active matching for the bare
 * bookmarks/index tab.
 */
export function ListingHubLayout({
  header, tabs, params, navAriaLabel,
}: Props) {
  return (
    <TabbedShell
      header={header}
      navAriaLabel={navAriaLabel}
      nav={tabs.map(tab => (
        <Link
          key={tab.label}
          to={tab.to}
          params={params}
          className={cn(navLinkClass)}
          activeOptions={tab.exact
            ? {
              exact: true,
            }
            : undefined}
          activeProps={{
            className: "bg-accent text-accent-foreground",
          }}
        >
          {tab.label}
        </Link>
      ))}
    >
      <Outlet />
    </TabbedShell>
  );
}
