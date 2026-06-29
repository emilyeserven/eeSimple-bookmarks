import type { TabNavItem } from "./TabbedEntityLayout";
import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet } from "@tanstack/react-router";

import { navLinkClass } from "./TabbedShell";

import { cn } from "@/lib/utils";

interface Props {
  header: ReactNode;
  /** Tab links rendered in the vertical rail (no `group`/"More" support — flat items only). */
  nav: readonly TabNavItem[];
  navAriaLabel: string;
}

/**
 * A vertical-rail variant of `TabbedEntityLayout`, used only by the Settings → Display section.
 * This intentionally deviates from the app's otherwise horizontal-only `TabbedShell` convention
 * (see CLAUDE.md): the Display section is explicitly designed with a left-hand vertical tab rail,
 * with each tab as its own sub-page rendered through `<Outlet/>`. On narrow screens the rail
 * collapses to a horizontal scrolling strip so the same component serves phones too.
 */
export function VerticalTabbedLayout({
  header, nav, navAriaLabel,
}: Props) {
  return (
    <section className="space-y-6">
      {header}
      <div
        className="
          flex flex-col gap-6
          md:flex-row
        "
      >
        <nav
          aria-label={navAriaLabel}
          className="
            flex flex-row gap-1 overflow-x-auto border-b pb-1
            md:w-48 md:shrink-0 md:flex-col md:border-b-0 md:pb-0
          "
        >
          {nav.map(item => (
            <Link
              key={item.label}
              to={item.to as LinkProps["to"]}
              className={cn(navLinkClass, "md:w-full")}
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
