import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";

import React from "react";

import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { BreadcrumbSwitcher } from "@/components/BreadcrumbSwitcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  /** When set, a hover-revealed switcher button beside the label switches to a sibling entity. */
  switcher?: SwitcherSpec;
}

/** One crumb: a link (parent) or the current page, with its optional sibling switcher. */
function CrumbItem({
  crumb,
}: {
  crumb: BreadcrumbSegment;
}) {
  return (
    <BreadcrumbItem className={cn(crumb.switcher && "group/crumb")}>
      {crumb.href
        ? (
          <BreadcrumbLink asChild>
            <Link to={crumb.href}>{crumb.label}</Link>
          </BreadcrumbLink>
        )
        : <BreadcrumbPage>{crumb.label}</BreadcrumbPage>}
      {crumb.switcher && <BreadcrumbSwitcher spec={crumb.switcher} />}
    </BreadcrumbItem>
  );
}

/** Wide-screen trail: `Parent → Parent → Current` on one line. */
function InlineBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  return (
    <Breadcrumb
      className="
        hidden
        md:block
      "
    >
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <CrumbItem crumb={crumb} />
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Small-screen layout: parent crumbs as subtle text stacked above the current page name. */
function StackedBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  const parents = crumbs.slice(0, -1);
  const current = crumbs[crumbs.length - 1];
  if (!current) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className="
        flex min-w-0 flex-col
        md:hidden
      "
    >
      {parents.length > 0 && (
        <ol
          className="
            flex flex-wrap items-center gap-1 text-xs text-muted-foreground
          "
        >
          {parents.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && (
                <li
                  role="presentation"
                  aria-hidden="true"
                  className="[&>svg]:size-3"
                >
                  <ChevronRight />
                </li>
              )}
              <li className="inline-flex items-center">
                {crumb.href
                  ? (
                    <Link
                      to={crumb.href}
                      className="
                        truncate transition-colors
                        hover:text-foreground
                      "
                    >
                      {crumb.label}
                    </Link>
                  )
                  : <span className="truncate">{crumb.label}</span>}
              </li>
            </React.Fragment>
          ))}
        </ol>
      )}
      <div
        className="
          group/crumb flex min-w-0 items-center gap-1 text-sm font-medium
          text-foreground
        "
      >
        <span className="truncate">{current.label}</span>
        {current.switcher && <BreadcrumbSwitcher spec={current.switcher} />}
      </div>
    </nav>
  );
}

/**
 * The app-bar breadcrumb trail. Wide screens show the horizontal `Parent → … → Current` trail; small
 * screens stack the parent crumbs as subtle text above the current page name. Both render from the
 * same `crumbs`, toggled by CSS so there's no first-paint flash.
 */
export function HeaderBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  return (
    <>
      <InlineBreadcrumbs crumbs={crumbs} />
      <StackedBreadcrumbs crumbs={crumbs} />
    </>
  );
}
