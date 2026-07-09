import type { Bookmark, BookmarkLocation, LocationRelation } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkCard } from "./BookmarkCard";
import { LocationHierarchyHoverCard } from "./LocationHierarchyHoverCard";
import { useBookmarks } from "../hooks/useBookmarks";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useResolveCardDisplay } from "../lib/cardDisplayRules";
import { buildLocationRelationCards } from "../lib/locationRelationCards";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * The card listing for a location relation's Info page. For each bookmark that relates to a location
 * under this relation it renders the bookmark as a sticky card on the left with its related
 * location(s) on the right, showing the relation between them. All data is derived client-side from
 * the already-loaded bookmark list — no endpoint (see {@link buildLocationRelationCards}). Mirrors
 * {@link import("./RelationshipTypeCardsView").RelationshipTypeCardsView}, but pairs a bookmark with
 * locations rather than with other bookmarks.
 */
export function LocationRelationCardsView({
  locationRelation,
}: { locationRelation: LocationRelation }) {
  const {
    t,
  } = useTranslation();
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    resolve: resolveDisplay, isPending: displayPending,
  } = useResolveCardDisplay();

  const groups = useMemo(
    () => buildLocationRelationCards(locationRelation.id, allBookmarks ?? []),
    [locationRelation.id, allBookmarks],
  );

  const renderCard = (bookmark: Bookmark): ReactNode => {
    const display = resolveDisplay(bookmark);
    return (
      <RowCard className="flex h-full flex-col p-4">
        <BookmarkCard
          bookmark={bookmark}
          properties={properties ?? []}
          sections={display.sections}
          imageCorners={display.imageCorners}
          imageMode={display.imageMode}
          imageVisibility={display.imageVisibility}
          hideWebsiteForYouTube={display.hideWebsiteForYouTube}
          loading={displayPending}
        />
      </RowCard>
    );
  };

  const renderLocationCard = (location: BookmarkLocation): ReactNode => (
    <RowCard className="p-4">
      <LocationHierarchyHoverCard location={location}>
        <Link
          to="/taxonomies/locations/$locationSlug"
          params={{
            locationSlug: location.slug,
          }}
          className="
            flex items-center gap-2 font-medium
            hover:underline
          "
        >
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          {location.name}
        </Link>
      </LocationHierarchyHoverCard>
      {location.placeType
        ? (
          <p className="mt-1 text-sm text-muted-foreground">{location.placeType}</p>
        )
        : null}
    </RowCard>
  );

  const connector = (): ReactNode => (
    <div
      className="
        flex flex-wrap items-center gap-2 text-sm text-muted-foreground
      "
    >
      <Badge variant="secondary">{locationRelation.name}</Badge>
      <span aria-hidden>→</span>
    </div>
  );

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No bookmarks are linked to a location by this relation yet.")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group, index) => (
        <section
          key={group.bookmark.id}
          className="space-y-4"
        >
          {index > 0 ? <Separator /> : null}
          <div
            className="
              gap-6
              md:grid md:grid-cols-[minmax(0,22rem)_1fr] md:items-start
            "
          >
            <div className="md:sticky md:top-4 md:self-start">
              {renderCard(group.bookmark)}
            </div>
            <div
              className="
                mt-4 space-y-4
                md:mt-0
              "
            >
              {group.locations.map(location => (
                <div
                  key={location.id}
                  className="flex items-center gap-4"
                >
                  <div className="shrink-0">{connector()}</div>
                  <div className="min-w-0 flex-1">{renderLocationCard(location)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
