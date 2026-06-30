import type { BreadcrumbSegment } from "./CrumbLabel";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ListTree } from "lucide-react";

import { CrumbLabel } from "./CrumbLabel";

import { BreadcrumbSwitcher } from "@/components/BreadcrumbSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
export function StackedBreadcrumbs({
  crumbs,
}: {
  crumbs: BreadcrumbSegment[];
}) {
  const [open, setOpen] = useState(false);
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
