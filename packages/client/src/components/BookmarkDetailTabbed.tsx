import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { navLinkClass, navStripClass } from "./TabbedShell";
import { LayoutDrivenTabBody } from "./workbench/LayoutDrivenTabBody";
import { useBookmarkViewTabs } from "../hooks/useBookmarkViewTabs";

import { cn } from "@/lib/utils";

interface BookmarkDetailTabbedProps {
  bookmark: Bookmark;
}

/**
 * The horizontal-tabbed bookmark detail layout. The resolved `"bookmark"` layout's view-visible tabs
 * become a horizontal tab strip above the active tab's `LayoutDrivenTabBody`. Tabs + empty-omission
 * come from `useBookmarkViewTabs` (shared with the single-column body). Media is rendered in the shared
 * header above this component (see BookmarkDetail).
 */
export function BookmarkDetailTabbed({
  bookmark,
}: BookmarkDetailTabbedProps) {
  const {
    t,
  } = useTranslation();
  const {
    layout, tabs, workbench, sectionMatches,
  } = useBookmarkViewTabs(bookmark);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (!layout || tabs.length === 0) return null;

  const active = tabs.find(tab => tab.key === activeKey) ?? tabs[0];

  return (
    <div className="min-w-0 flex-1 space-y-4">
      <nav
        className={navStripClass}
        aria-label={t("Bookmark sections")}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveKey(tab.key)}
            className={cn(
              navLinkClass,
              "text-left",
              tab.key === active.key && "bg-accent text-accent-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 pb-6">
        <LayoutDrivenTabBody
          workbench={workbench}
          layout={layout}
          tabKey={active.key}
          mode="view"
          entity={bookmark}
          sectionMatches={sectionMatches}
        />
      </div>
    </div>
  );
}
