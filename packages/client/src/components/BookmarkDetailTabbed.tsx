import type { BookmarkDetailSectionId } from "./bookmarkDetailSections";
import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { BookmarkDetailMedia } from "./BookmarkDetailMedia";
import { buildBookmarkDetailSections } from "./bookmarkDetailSections";
import { navLinkClass, navStripClass } from "./TabbedShell";
import { useBookmarkDetailVideoSize } from "../hooks/useAppSettings";
import { useBookmarks } from "../hooks/useBookmarks";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkHierarchy } from "../lib/bookmarkHierarchy";
import { flattenTree } from "../lib/tagTree";

import { cn } from "@/lib/utils";

interface BookmarkDetailTabbedProps {
  bookmark: Bookmark;
  categories: Category[];
  properties: CustomProperty[];
  propertyGroups: PropertyGroup[];
  /** The YouTube embed URL for this bookmark, or `null` when it isn't a YouTube video. */
  embedUrl: string | null;
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The horizontal-tabbed bookmark detail layout. The detail sections become a horizontal tab strip
 * rendered directly above the active tab's content; the media placement adapts to its size:
 * - Case 1 (image or constrained "standard" video): media on the left, the tab strip + active
 *   content on the right.
 * - Case 2 ("half"/"two-thirds" video): the General/Details section sits beside the video; the tab
 *   strip + the remaining sections render full-width below (General is not a tab).
 * - Case 3 ("fullwidth" video): the video spans the top; the tab strip + content render below.
 */
export function BookmarkDetailTabbed({
  bookmark, categories, properties, propertyGroups, embedUrl, onSaveBoolean,
}: BookmarkDetailTabbedProps) {
  const videoSize = useBookmarkDetailVideoSize();
  const {
    data: allBookmarks,
  } = useBookmarks();
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
  });

  const isVideo = Boolean(embedUrl);
  const hasMedia = isVideo || Boolean(bookmark.image);
  // Case 2/3 pull media out of the side-by-side flow; only "standard" video / images stay in Case 1.
  const mediaCase = isVideo && videoSize === "fullwidth"
    ? 3
    : isVideo && (videoSize === "half" || videoSize === "twoThirds")
      ? 2
      : 1;

  const general = sections.find(section => section.id === "general");
  // In Case 2 the General section is pinned beside the video, so it is excluded from the tab list.
  const tabs = mediaCase === 2
    ? sections.filter(section => section.id !== "general")
    : sections;

  const [activeId, setActiveId] = useState<BookmarkDetailSectionId>(tabs[0].id);
  // Derived (not effateful): keeps a valid active tab even when the tab set changes (e.g. video-size
  // change moving General in/out of the tabs).
  const active = tabs.find(tab => tab.id === activeId) ?? tabs[0];

  const media = (
    <BookmarkDetailMedia
      bookmark={bookmark}
      embedUrl={embedUrl}
    />
  );

  const nav = (
    <nav
      className={navStripClass}
      aria-label="Bookmark sections"
    >
      {tabs.map(tab => (
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
  );

  // The default arrangement (also the Case 1 no-media fallback, and the lower block of Cases 2 & 3):
  // the horizontal tab strip stacked above the active content.
  const navAboveContent: ReactNode = (
    <div className="min-w-0 flex-1 space-y-4">
      {nav}
      <div className="min-w-0">{active.content}</div>
    </div>
  );

  if (mediaCase === 1) {
    if (!hasMedia) return navAboveContent;
    // Media on the left; the tab strip + active content stacked on the right.
    return (
      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-start
        "
      >
        <div className="@2xl:shrink-0">{media}</div>
        {navAboveContent}
      </div>
    );
  }

  if (mediaCase === 2) {
    return (
      <div className="space-y-6">
        <div
          className="
            flex flex-col gap-6
            @2xl:flex-row @2xl:items-start
          "
        >
          {media}
          <div className="min-w-0 flex-1">{general?.content}</div>
        </div>
        {navAboveContent}
      </div>
    );
  }

  // Case 3: full-width video on top, tab strip + content below.
  return (
    <div className="space-y-6">
      {media}
      {navAboveContent}
    </div>
  );
}
