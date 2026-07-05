import type { BreadcrumbSegment } from "./CrumbLabel";

import React from "react";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { CrumbLabel } from "./CrumbLabel";
import { StackedBreadcrumbs } from "./StackedBreadcrumbs";

import { BreadcrumbSwitcher } from "@/components/BreadcrumbSwitcher";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type { BreadcrumbSegment } from "./CrumbLabel";

/** One crumb: a link (parent) or the current page, with its optional sibling switcher. */
function CrumbItem({
  crumb,
}: {
  crumb: BreadcrumbSegment;
}) {
  return (
    <BreadcrumbItem
      // Ancestor (link) crumbs keep their natural width; the current page (no href) is allowed to
      // shrink so its long label truncates to an ellipsis instead of widening the header/main pane.
      className={cn(
        "items-center",
        crumb.href && !crumb.truncatable ? "shrink-0" : "min-w-0",
        crumb.switcher && "group/crumb",
      )}
    >
      {crumb.href
        ? (
          <BreadcrumbLink asChild>
            <Link to={crumb.href}>
              <CrumbLabel
                label={crumb.label}
                names={crumb.names}
              />
            </Link>
          </BreadcrumbLink>
        )
        : (
          <BreadcrumbPage>
            <CrumbLabel
              label={crumb.label}
              names={crumb.names}
            />
          </BreadcrumbPage>
        )}
      {crumb.switcher && <BreadcrumbSwitcher spec={crumb.switcher} />}
    </BreadcrumbItem>
  );
}

/**
 * The collapsed middle of a long trail: an ellipsis that opens a dropdown listing the hidden
 * crumbs (shadcn's canonical collapsed-breadcrumb pattern). Each hidden crumb stays a working link
 * (or a plain row when it has no href), keeping its secondary-name subtitle via `CrumbLabel`.
 */
function CollapsedCrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  const {
    t,
  } = useTranslation();
  return (
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={t("Show hidden breadcrumbs")}
          className="
            flex items-center gap-1 rounded-sm text-muted-foreground
            transition-colors
            hover:text-foreground
            focus-visible:text-foreground
            data-[state=open]:text-foreground
          "
        >
          <BreadcrumbEllipsis className="size-4" />
          <span className="sr-only">{t("Toggle menu")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {crumbs.map(crumb => (
            <DropdownMenuItem
              key={crumb.label}
              asChild={Boolean(crumb.href)}
            >
              {crumb.href
                ? (
                  <Link to={crumb.href}>
                    <CrumbLabel
                      label={crumb.label}
                      names={crumb.names}
                    />
                  </Link>
                )
                : (
                  <CrumbLabel
                    label={crumb.label}
                    names={crumb.names}
                  />
                )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
}

/**
 * Wide-screen trail: `Parent → … → Current` on one line, vertically centered. When the trail has
 * more than 3 crumbs the middle ones collapse into a clickable ellipsis dropdown, keeping the root
 * plus the last two crumbs visible.
 */
function InlineBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  const collapsed = crumbs.length > 3;
  const crumbNode = (crumb: BreadcrumbSegment) => ({
    key: crumb.label,
    element: <CrumbItem crumb={crumb} />,
  });
  // Each visible node carries a stable key; when collapsed the trail is first → ⋯ → last two.
  const nodes: { key: string;
    element: React.ReactNode; }[] = collapsed
    ? [
      ...crumbs.slice(0, 1).map(crumbNode),
      {
        key: "ellipsis",
        element: <CollapsedCrumbs crumbs={crumbs.slice(1, -2)} />,
      },
      ...crumbs.slice(-2).map(crumbNode),
    ]
    : crumbs.map(crumbNode);

  return (
    <Breadcrumb
      className="
        hidden min-w-0
        md:block
      "
    >
      <BreadcrumbList className="min-w-0 flex-nowrap items-center">
        {nodes.map((node, i) => (
          <React.Fragment key={node.key}>
            {i > 0 && <BreadcrumbSeparator className="shrink-0" />}
            {node.element}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * The app-bar breadcrumb trail. Wide screens show the horizontal `Parent → … → Current` trail; small
 * screens show only the current entry plus a button that opens a top drawer with the full trail.
 * Both render from the same `crumbs`, toggled by CSS so there's no first-paint flash.
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
