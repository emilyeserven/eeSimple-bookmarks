import type { BookmarkDetailSectionId } from "./bookmarkDetailSections";
import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { useState } from "react";

import { buildBookmarkDetailSections } from "./bookmarkDetailSections";
import { navLinkClass, navStripClass } from "./TabbedShell";
import { useBookmarks } from "../hooks/useBookmarks";
import { useLocationTree } from "../hooks/useLocations";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkHierarchy } from "../lib/bookmarkHierarchy";
import { flattenTree } from "../lib/tagTree";

import { cn } from "@/lib/utils";

interface BookmarkDetailTabbedProps {
  bookmark: Bookmark;
  categories: Category[];
  properties: CustomProperty[];
  propertyGroups: PropertyGroup[];
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The horizontal-tabbed bookmark detail layout. The detail sections become a horizontal tab strip
 * rendered directly above the active tab's content. Media is rendered in the shared header above
 * this component (see BookmarkDetail).
 */
export function BookmarkDetailTabbed({
  bookmark, categories, properties, propertyGroups, onSaveBoolean,
}: BookmarkDetailTabbedProps) {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: locationTree,
  } = useLocationTree();
  const flatHierarchy = flattenTree(buildBookmarkHierarchy(bookmark.id, allBookmarks ?? []));
  const defaultFieldZones = useDefaultFieldZones();

  const sections = buildBookmarkDetailSections({
    bookmark,
    categories,
    properties,
    propertyGroups,
    flatHierarchy,
    onSaveBoolean,
    defaultFieldZones,
    locationTree,
  });

  const [activeId, setActiveId] = useState<BookmarkDetailSectionId>(sections[0].id);
  const active = sections.find(tab => tab.id === activeId) ?? sections[0];

  return (
    <div className="min-w-0 flex-1 space-y-4">
      <nav
        className={navStripClass}
        aria-label="Bookmark sections"
      >
        {sections.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={cn(
              navLinkClass,
              "text-left",
              tab.id === active.id && "bg-accent text-accent-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 pb-6">{active.content}</div>
    </div>
  );
}
