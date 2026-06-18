import type { Bookmark, CustomProperty } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
}

/** The body of a bookmark card: description, taxonomy badges, tags, and custom-property value badges. */
export function BookmarkCardDetails({
  bookmark, properties,
}: BookmarkCardDetailsProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberBadges = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${formatNumber(entry.value, property)}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const booleanBadges = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${entry.value ? "Yes" : "No"}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const dateTimeBadges = bookmark.dateTimeValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.showInListings
        ? {
          id: entry.propertyId,
          label: `${property.name}: ${formatDateTime(entry.value, property)}`,
        }
        : null;
    })
    .filter((badge): badge is { id: string;
      label: string; } => badge !== null);

  const valueBadges = [...numberBadges, ...booleanBadges, ...dateTimeBadges];

  const {
    website, mediaType, youtubeChannel,
  } = bookmark;

  return (
    <>
      {bookmark.description
        ? (
          <div className="relative mt-2 max-h-18 overflow-hidden">
            <p className="text-sm/6 text-foreground">{bookmark.description}</p>
            <div
              className="
                pointer-events-none absolute inset-x-0 bottom-0 h-8
                bg-linear-to-t from-card to-transparent
              "
            />
          </div>
        )
        : null}
      {website || mediaType || youtubeChannel
        ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {website
              ? (
                <Link
                  to="/taxonomies/websites/$websiteSlug"
                  params={{
                    websiteSlug: website.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "website", website.id)}
                >
                  <Badge variant="secondary">{website.siteName}</Badge>
                </Link>
              )
              : null}
            {mediaType
              ? (
                <Link
                  to="/taxonomies/media-types/$mediaTypeSlug"
                  params={{
                    mediaTypeSlug: mediaType.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "media-type", mediaType.id)}
                >
                  <Badge variant="secondary">{mediaType.name}</Badge>
                </Link>
              )
              : null}
            {youtubeChannel
              ? (
                <Link
                  to="/taxonomies/youtube-channels/$channelSlug"
                  params={{
                    channelSlug: youtubeChannel.slug,
                  }}
                  title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                  onClick={event => viewClick(event, "youtube-channel", youtubeChannel.id)}
                >
                  <Badge variant="secondary">{youtubeChannel.name}</Badge>
                </Link>
              )
              : null}
          </div>
        )
        : null}
      {bookmark.tags.length > 0 ? <BookmarkTagsBox tags={bookmark.tags} /> : null}
      {valueBadges.length > 0
        ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {valueBadges.map(badge => (
              <li key={badge.id}>
                <Badge variant="outline">{badge.label}</Badge>
              </li>
            ))}
          </ul>
        )
        : null}
    </>
  );
}
