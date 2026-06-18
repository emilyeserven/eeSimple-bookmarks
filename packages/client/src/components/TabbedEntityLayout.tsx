import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

export interface TabNavItem {
  to: LinkProps["to"];
  label: string;
}

interface Props {
  header: ReactNode;
  /** Tab links rendered in the left vertical nav; all share `params`. */
  nav: readonly TabNavItem[];
  /** Route params shared by every nav link (e.g. `{ websiteSlug }`). */
  params?: LinkProps["params"];
  navAriaLabel: string;
}

/** Shared vertical-tabbed layout shell used by all slug-routed entities. */
export function TabbedEntityLayout({
  header, nav, params, navAriaLabel,
}: Props) {
  return (
    <section className="space-y-6">
      {header}
      <div
        className="
          flex flex-col gap-6
          sm:flex-row
        "
      >
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label={navAriaLabel}
        >
          {nav.map(item => (
            <Link
              key={item.label}
              to={item.to}
              params={params}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
