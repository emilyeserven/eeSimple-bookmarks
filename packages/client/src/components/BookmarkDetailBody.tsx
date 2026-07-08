import type { Bookmark } from "@eesimple/types";

import { Fragment } from "react";

import { LayoutDrivenTabBody } from "./workbench/LayoutDrivenTabBody";
import { useBookmarkViewTabs } from "../hooks/useBookmarkViewTabs";

import { Separator } from "@/components/ui/separator";

interface BookmarkDetailBodyProps {
  bookmark: Bookmark;
}

/**
 * The single-column bookmark detail body: the resolved `"bookmark"` layout flattened in tab order —
 * each view-visible tab's fields stacked and divided by separators (design §7-A). Tabs and their
 * empty-omission come from `useBookmarkViewTabs`; each field self-loads its data via
 * `LayoutDrivenTabBody`. Media is rendered in the shared header above this component (see BookmarkDetail).
 */
export function BookmarkDetailBody({
  bookmark,
}: BookmarkDetailBodyProps) {
  const {
    layout, tabs, workbench, sectionMatches,
  } = useBookmarkViewTabs(bookmark);
  if (!layout) return null;

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {tabs.map((tab, index) => (
        <Fragment key={tab.key}>
          {index > 0
            ? <Separator />
            : null}
          <LayoutDrivenTabBody
            workbench={workbench}
            layout={layout}
            tabKey={tab.key}
            mode="view"
            entity={bookmark}
            sectionMatches={sectionMatches}
          />
        </Fragment>
      ))}
    </div>
  );
}
