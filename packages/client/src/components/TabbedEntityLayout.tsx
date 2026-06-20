import type { LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Link, Outlet } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

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
  /** Tab links rendered in the left vertical nav; all share `params`. */
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
        <Collapsible
          className="
            group/nav shrink-0
            sm:w-48
          "
        >
          <CollapsibleTrigger
            className="
              flex w-full items-center justify-between rounded-md px-3 py-2
              text-xs font-semibold tracking-wide text-muted-foreground
              uppercase transition-colors
              hover:bg-accent hover:text-accent-foreground
              sm:hidden
            "
          >
            Navigation
            <ChevronDown
              className="
                size-4 transition-transform
                group-data-[state=open]/nav:rotate-180
              "
            />
          </CollapsibleTrigger>
          <CollapsibleContent
            forceMount
            className="
              hidden
              data-[state=open]:block
              sm:block
            "
          >
            <nav
              className="flex flex-col gap-1"
              aria-label={navAriaLabel}
            >
              {nav.map((entry) => {
                if ("type" in entry && entry.type === "group") {
                  return (
                    <div
                      key={entry.label}
                      className="mt-2 flex flex-col gap-1"
                    >
                      <Separator className="mb-1" />
                      <p
                        className="
                          px-3 pt-3 pb-0.5 text-xs font-semibold tracking-wide
                          text-muted-foreground uppercase
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
              })}
            </nav>
          </CollapsibleContent>
        </Collapsible>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
