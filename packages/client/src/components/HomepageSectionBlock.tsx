import type { HomepageSectionBookmarks, CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { useBookmarkTableColumns } from "./tables/bookmarkColumns";
import { useTableRowNav } from "./tables/useTableRowNav";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

interface HomepageSectionBlockProps {
  data: HomepageSectionBookmarks;
  customProperties: CustomProperty[];
}

export function HomepageSectionBlock({
  data, customProperties,
}: HomepageSectionBlockProps) {
  const {
    section, bookmarks,
  } = data;
  const columns = section.columns;
  const imageMode = section.imageMode;
  const imageVisibility = section.imageVisibility;
  const imageLayout = section.imageLayout;
  const imageLeft = columns === 1 || (columns === 2 && imageLayout === "side");
  const hiddenFields = new Set(section.hiddenCardFields);
  const collapsedIds = useUiStore(state => state.collapsedHomepageSectionIds);
  const toggle = useUiStore(state => state.toggleHomepageSectionCollapsed);
  const isCollapsed = collapsedIds.includes(section.id);

  const navigate = useNavigate();
  const rowNav = useTableRowNav();
  const tableColumns = useBookmarkTableColumns({
    properties: customProperties,
    hidden: hiddenFields,
    imageMode,
    imageVisibility,
    hideWebsiteForYouTube: section.hideWebsiteForYouTube,
  });

  return (
    <section aria-label={section.title}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.description && !isCollapsed
            ? <p className="text-sm text-muted-foreground">{section.description}</p>
            : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={isCollapsed ? `Expand ${section.title}` : `Collapse ${section.title}`}
          onClick={() => toggle(section.id)}
        >
          {isCollapsed
            ? <ChevronRight className="size-4" />
            : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {!isCollapsed && (
        bookmarks.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No bookmarks match this section&rsquo;s filter.
            </p>
          )
          : section.viewMode === "table"
            ? (
              <DataTable
                columns={tableColumns}
                data={bookmarks}
                sortable
                onRowClick={(bookmark, event) =>
                  rowNav(event, "bookmark", bookmark.id, () => {
                    void navigate({
                      to: "/bookmarks/$bookmarkId",
                      params: {
                        bookmarkId: bookmark.id,
                      },
                    });
                  })}
              />
            )
            : (
              <div
                className={`
                  grid gap-3
                  ${COLUMN_CLASS[columns]}
                `}
              >
                {bookmarks.map(bookmark => (
                  <RowCard
                    key={bookmark.id}
                    className="p-4"
                  >
                    <BookmarkCard
                      bookmark={bookmark}
                      properties={customProperties}
                      imageLeft={imageLeft}
                      imageMode={imageMode}
                      imageVisibility={imageVisibility}
                      hiddenFields={hiddenFields}
                      cornerOverlays={section.cornerOverlays}
                      hideWebsiteForYouTube={section.hideWebsiteForYouTube}
                    />
                  </RowCard>
                ))}
              </div>
            )
      )}
    </section>
  );
}
