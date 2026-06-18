import type { HomepageSectionBookmarks, CustomProperty } from "@eesimple/types";

import { ChevronDown, ChevronRight } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HomepageSectionBlockProps {
  data: HomepageSectionBookmarks;
  columns: number;
  customProperties: CustomProperty[];
}

export function HomepageSectionBlock({
  data, columns, customProperties,
}: HomepageSectionBlockProps) {
  const {
    section, bookmarks,
  } = data;
  const collapsedIds = useUiStore(state => state.collapsedHomepageSectionIds);
  const toggle = useUiStore(state => state.toggleHomepageSectionCollapsed);
  const isCollapsed = collapsedIds.includes(section.id);

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
        bookmarks.length > 0
          ? (
            <div
              className={`
                grid gap-3
                ${COLUMN_CLASS[columns]}
              `}
            >
              {bookmarks.map(bookmark => (
                <Card
                  key={bookmark.id}
                  className="p-4"
                >
                  <BookmarkCard
                    bookmark={bookmark}
                    properties={customProperties}
                    imageLeft={columns === 1}
                  />
                </Card>
              ))}
            </div>
          )
          : (
            <p className="text-sm text-muted-foreground">
              No bookmarks match this section&rsquo;s filter.
            </p>
          )
      )}
    </section>
  );
}
