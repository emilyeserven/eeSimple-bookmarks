import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";

import React from "react";

import { Link } from "@tanstack/react-router";
import { ListTree } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShowRomanizedByDefault } from "@/hooks/useAppSettings";
import { orderRomanized } from "@/lib/romanized";
import { cn } from "@/lib/utils";

export interface BreadcrumbSegment {
  label: string;
  /** Optional romanized form, rendered stacked beneath the label in subtle text. */
  romanizedLabel?: string | null;
  href?: string;
  /** When set, a hover-revealed switcher button beside the label switches to a sibling entity. */
  switcher?: SwitcherSpec;
}

/**
 * A crumb's text: the primary label with its romanized form stacked beneath it in subtle muted
 * text. Which form is primary follows the user's "Show romanized by default" preference (same as
 * every other romanized render site). With no romanized value it collapses to the single label.
 */
function CrumbLabel({
  label,
  romanizedLabel,
}: {
  label: string;
  romanizedLabel?: string | null;
}) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary, secondary,
  } = orderRomanized(label, romanizedLabel, showRomanizedFirst);
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{primary}</span>
      {secondary
        ? (
          <span
            className="truncate text-xs/tight font-normal text-muted-foreground"
          >
            {secondary}
          </span>
        )
        : null}
    </span>
  );
}

/** One crumb: a link (parent) or the current page, with its optional sibling switcher. */
function CrumbItem({
  crumb,
}: {
  crumb: BreadcrumbSegment;
}) {
  return (
    <BreadcrumbItem
      className={cn("items-center", crumb.switcher && "group/crumb")}
    >
      {crumb.href
        ? (
          <BreadcrumbLink asChild>
            <Link to={crumb.href}>
              <CrumbLabel
                label={crumb.label}
                romanizedLabel={crumb.romanizedLabel}
              />
            </Link>
          </BreadcrumbLink>
        )
        : (
          <BreadcrumbPage>
            <CrumbLabel
              label={crumb.label}
              romanizedLabel={crumb.romanizedLabel}
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
 * (or a plain row when it has no href), keeping its romanized subtitle via `CrumbLabel`.
 */
function CollapsedCrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  return (
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Show hidden breadcrumbs"
          className="
            flex items-center gap-1 rounded-sm text-muted-foreground
            transition-colors
            hover:text-foreground
            focus-visible:text-foreground
            data-[state=open]:text-foreground
          "
        >
          <BreadcrumbEllipsis className="size-4" />
          <span className="sr-only">Toggle menu</span>
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
                      romanizedLabel={crumb.romanizedLabel}
                    />
                  </Link>
                )
                : (
                  <CrumbLabel
                    label={crumb.label}
                    romanizedLabel={crumb.romanizedLabel}
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
        hidden
        md:block
      "
    >
      <BreadcrumbList className="items-center">
        {nodes.map((node, i) => (
          <React.Fragment key={node.key}>
            {i > 0 && <BreadcrumbSeparator />}
            {node.element}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** One row in the mobile trail drawer: a link to an ancestor, or the highlighted current page. */
function TrailRow({
  crumb,
  isCurrent,
}: {
  crumb: BreadcrumbSegment;
  isCurrent: boolean;
}) {
  const content = (
    <CrumbLabel
      label={crumb.label}
      romanizedLabel={crumb.romanizedLabel}
    />
  );
  if (isCurrent || !crumb.href) {
    return (
      <div
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          "flex min-w-0 items-center rounded-md px-3 py-2 text-sm",
          isCurrent
            ? "bg-accent font-medium text-foreground"
            : "text-muted-foreground",
        )}
      >
        {content}
      </div>
    );
  }
  return (
    <SheetClose asChild>
      <Link
        to={crumb.href}
        className="
          flex min-w-0 items-center rounded-md px-3 py-2 text-sm
          transition-colors
          hover:bg-accent hover:text-foreground
        "
      >
        {content}
      </Link>
    </SheetClose>
  );
}

/**
 * Small-screen layout: show only the current entry. A button opens a drawer from the top listing
 * the full trail, one crumb per row (ancestors tappable, current highlighted).
 */
function StackedBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  const [open, setOpen] = React.useState(false);
  const current = crumbs[crumbs.length - 1];
  if (!current) return null;
  const hasAncestors = crumbs.length > 1;

  return (
    <nav
      aria-label="breadcrumb"
      className="
        flex min-w-0 items-center gap-1
        md:hidden
      "
    >
      {hasAncestors && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label="Show breadcrumb trail"
            onClick={() => setOpen(true)}
          >
            <ListTree className="size-4" />
          </Button>
          <SheetContent
            side="top"
            className="gap-0"
          >
            <SheetHeader className="pb-2">
              <SheetTitle>Breadcrumb trail</SheetTitle>
            </SheetHeader>
            <ol className="flex flex-col gap-0.5 px-2 pb-4">
              {crumbs.map((crumb, i) => (
                <li key={crumb.label}>
                  <TrailRow
                    crumb={crumb}
                    isCurrent={i === crumbs.length - 1}
                  />
                </li>
              ))}
            </ol>
          </SheetContent>
        </Sheet>
      )}
      <div
        className="
          group/crumb flex min-w-0 items-center gap-1 text-sm font-medium
          text-foreground
        "
      >
        <CrumbLabel
          label={current.label}
          romanizedLabel={current.romanizedLabel}
        />
        {current.switcher && <BreadcrumbSwitcher spec={current.switcher} />}
      </div>
    </nav>
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
