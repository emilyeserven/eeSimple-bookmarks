import type { HomepageSectionBookmarks, CustomProperty } from "@eesimple/types";

import { ChevronDown, ChevronRight } from "lucide-react";

import { BookmarkCard } from "./BookmarkCard";
import { HomepageSectionTable } from "./HomepageSectionTable";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { flattenFieldZonesToCard, hiddenFieldKeysFromZones, restrictFieldZones } from "../lib/bookmarkCardValues";
import { COLUMN_CLASS } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";

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
  // A migrated section carries its own per-zone placements. A legacy section (`fieldZones === null`)
  // falls back to the Default card display rule's zones, restricted by its old hidden-field list and
  // collapsed when corner overlays are off — preserving its pre-migration appearance until it's edited.
  const defaultZones = useDefaultFieldZones();
  const cardFieldZones = section.fieldZones
    ?? (defaultZones
      ? restrictFieldZones(
        section.cornerOverlays ? defaultZones : flattenFieldZonesToCard(defaultZones),
        new Set(section.hiddenCardFields),
      )
      : undefined);
  // The table view hides whatever the cards hide: keys absent from the resolved zones.
  const hiddenFields = cardFieldZones
    ? hiddenFieldKeysFromZones(cardFieldZones, customProperties)
    : new Set<string>();
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
        bookmarks.length === 0
          ? (
            <p className="text-sm text-muted-foreground">
              No bookmarks match this section&rsquo;s filter.
            </p>
          )
          : section.viewMode === "table"
            ? (
              <HomepageSectionTable
                bookmarks={bookmarks}
                customProperties={customProperties}
                hiddenFields={hiddenFields}
                imageMode={imageMode}
                imageVisibility={imageVisibility}
                hideWebsiteForYouTube={section.hideWebsiteForYouTube}
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
                      fieldZones={cardFieldZones}
                      cardZoneLayouts={section.cardZoneLayouts ?? undefined}
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
