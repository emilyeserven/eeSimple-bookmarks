import type { Bookmark, CustomProperty } from "@eesimple/types";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";
import { StarRating } from "./StarRating";
import { useHiddenCardFields } from "../lib/bookmarkCardFields";
import { formatBooleanBadge, formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Listing-page key, so fields toggled off in that page's Card Options are hidden. Omitted off listing pages. */
  pageKey?: string;
  /** Explicit hidden field keys, overriding the `pageKey` lookup. Used by DB-backed surfaces (homepage sections). */
  hiddenFields?: Set<string>;
  /** Persist a rating-scale value edited inline on the card (only wired when the property is `editableOnCard`). */
  onSaveRating?: (propertyId: string, value: number) => void;
}

/** The body of a bookmark card: description, taxonomy badges, tags, and custom-property value badges. */
export function BookmarkCardDetails({
  bookmark, properties, pageKey, hiddenFields, onSaveRating,
}: BookmarkCardDetailsProps) {
  const pageHidden = useHiddenCardFields(pageKey);
  const hidden = hiddenFields ?? pageHidden;
  const byId = new Map(properties.map(property => [property.id, property]));
  const {
    data: allCategories,
  } = useCategories();
  const bookmarkCategory = (allCategories ?? []).find(
    c => c.id === bookmark.categoryId && !c.builtIn,
  );

  // Rating-scale values live in numberValues but render as stars rather than a text badge.
  const ratingEntries = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property && property.type === "ratingScale" && property.showInListings
        && !hidden.has(entry.propertyId)
        ? {
          property,
          value: entry.value,
        }
        : null;
    })
    .filter((entry): entry is { property: CustomProperty;
      value: number; } => entry !== null);

  const numberBadges = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      // Rating scales render as stars below, not as a number badge.
      return property && property.showInListings && property.type !== "ratingScale"
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
        label: formatBooleanBadge(entry.value, property),
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
      {ratingEntries.length > 0
        ? (
          <ul className="mt-2 space-y-1">
            {ratingEntries.map(({
              property, value,
            }) => {
              const editable = property.editableOnCard && onSaveRating !== undefined;
              return (
                <li
                  key={property.id}
                  className="
                    flex flex-wrap items-center gap-2 text-sm
                    text-muted-foreground
                  "
                >
                  <span>{property.name}</span>
                  <StarRating
                    value={value}
                    max={property.ratingMax ?? 5}
                    allowHalf={property.ratingAllowHalf}
                    allowZero={property.ratingAllowZero}
                    readOnly={!editable}
                    onChange={editable ? next => onSaveRating(property.id, next) : undefined}
                    label={property.ratingShowLabel ? (property.ratingLabel ?? undefined) : undefined}
                    size={16}
                  />
                </li>
              );
            })}
          </ul>
        )
        : null}
    </>
  );
}
