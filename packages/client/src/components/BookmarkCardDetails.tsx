import type { Bookmark, CustomProperty } from "@eesimple/types";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";
import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
}

/** The body of a bookmark card: description, taxonomy badges, tags, and custom-property value badges. */
export function BookmarkCardDetails({
  bookmark, properties,
}: BookmarkCardDetailsProps) {
  const byId = new Map(properties.map(property => [property.id, property]));
  const {
    data: allCategories,
  } = useCategories();
  const bookmarkCategory = (allCategories ?? []).find(
    c => c.id === bookmark.categoryId && !c.builtIn,
  );

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
      {bookmarkCategory || website || mediaType || youtubeChannel
        ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {bookmarkCategory
              ? <CategoryPill category={bookmarkCategory} />
              : null}
            {website
              ? <SourcePill type="website" data={website} />
              : null}
            {mediaType
              ? <MediaTypePill mediaType={mediaType} />
              : null}
            {youtubeChannel
              ? <SourcePill type="youtube-channel" data={youtubeChannel} />
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
