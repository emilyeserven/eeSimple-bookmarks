import type { Bookmark, CustomProperty } from "@eesimple/types";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";
import { useHiddenCardFields } from "../lib/bookmarkCardFields";
import { formatBoolean, formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Listing-page key, so fields toggled off in that page's Card Options are hidden. Omitted off listing pages. */
  pageKey?: string;
}

/** The body of a bookmark card: description, taxonomy badges, tags, and custom-property value badges. */
export function BookmarkCardDetails({
  bookmark, properties, pageKey,
}: BookmarkCardDetailsProps) {
  const hidden = useHiddenCardFields(pageKey);
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
      if (!property || !property.showInListings) return null;
      if (!entry.value && !property.showIfFalse) return null;
      return {
        id: entry.propertyId,
        label: `${property.name}: ${formatBoolean(entry.value, property)}`,
      };
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

  const valueBadges = [...numberBadges, ...booleanBadges, ...dateTimeBadges]
    .filter(badge => !hidden.has(badge.id));

  const {
    website, mediaType, youtubeChannel,
  } = bookmark;

  const showDescription = !!bookmark.description && !hidden.has("description");
  const showCategory = !!bookmarkCategory && !hidden.has("category");
  const showWebsite = !!website && !hidden.has("website");
  const showMediaType = !!mediaType && !hidden.has("mediaType");
  const showYoutubeChannel = !!youtubeChannel && !hidden.has("youtubeChannel");
  const showTags = bookmark.tags.length > 0 && !hidden.has("tags");

  return (
    <>
      {showDescription
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
      {showCategory || showWebsite || showMediaType || showYoutubeChannel
        ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {showCategory && bookmarkCategory
              ? <CategoryPill category={bookmarkCategory} />
              : null}
            {showWebsite && website
              ? (
                <SourcePill
                  type="website"
                  data={website}
                />
              )
              : null}
            {showMediaType && mediaType
              ? <MediaTypePill mediaType={mediaType} />
              : null}
            {showYoutubeChannel && youtubeChannel
              ? (
                <SourcePill
                  type="youtube-channel"
                  data={youtubeChannel}
                />
              )
              : null}
          </div>
        )
        : null}
      {showTags ? <BookmarkTagsBox tags={bookmark.tags} /> : null}
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
