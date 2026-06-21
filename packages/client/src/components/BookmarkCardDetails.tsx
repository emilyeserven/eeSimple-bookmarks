import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { BookmarkTagsBox } from "./BookmarkTagsBox";
import { CategoryPill } from "./CategoryPill";
import { MediaTypePill } from "./MediaTypePill";
import { SourcePill } from "./SourcePill";
import { StarRating } from "./StarRating";
import { useHiddenCardFields, useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";

import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useCategories";

interface BookmarkCardDetailsProps {
  bookmark: Bookmark;
  properties: CustomProperty[];
  /** Listing-page key, so fields toggled off in that page's Card Options are hidden. Omitted off listing pages. */
  pageKey?: string;
  /** Explicit hidden field keys, overriding the `pageKey` lookup. Used by DB-backed surfaces (homepage sections). */
  hiddenFields?: Set<string>;
  /** Resolved "hide website pill for YouTube" value; when omitted, the Default card display rule applies. */
  hideWebsiteForYouTube?: boolean;
  /** Property ids already rendered as image-corner overlays by the card; excluded here so they don't double up. */
  cornerPropertyIds?: Set<string>;
  /** Persist a rating-scale value edited inline on the card (only wired when the property is `editableOnCard`). */
  onSaveRating?: (propertyId: string, value: number) => void;
  /** Toggle a boolean value from the card (only wired for properties with `clickableInView`). */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/** The body of a bookmark card: description, taxonomy badges, tags, and custom-property value badges. */
export function BookmarkCardDetails({
  bookmark, properties, pageKey, hiddenFields, hideWebsiteForYouTube, cornerPropertyIds,
  onSaveRating, onSaveBoolean,
}: BookmarkCardDetailsProps) {
  const pageHidden = useHiddenCardFields(pageKey);
  const hidden = hiddenFields ?? pageHidden;
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;
  const {
    data: allCategories,
  } = useCategories();
  const bookmarkCategory = (allCategories ?? []).find(
    c => c.id === bookmark.categoryId && !c.builtIn,
  );

  // Single source of truth for value placement; anything overlaid on the image (cornerPropertyIds)
  // is excluded here so a corner-placed value isn't also shown as a badge.
  const items = buildBookmarkValueItems(bookmark, properties, hidden)
    .filter(item => !cornerPropertyIds?.has(item.id));

  const ratingEntries = items
    .filter(item => item.kind === "rating")
    .map(item => ({
      property: item.property,
      value: item.value,
    }));

  const valueBadges = items
    .filter(item => item.kind === "badge")
    .map((item) => {
      const onToggle = onSaveBoolean && item.property.clickableInView && item.booleanValue !== undefined
        ? () => onSaveBoolean(item.id, !item.booleanValue)
        : undefined;
      return {
        id: item.id,
        label: item.label,
        onToggle,
      };
    });

  const {
    website, mediaType, youtubeChannel,
  } = bookmark;

  const showDescription = !!bookmark.description && !hidden.has("description");

  // Only fade the description when it's actually clipped by the 4-line box — a short description
  // shouldn't imply hidden text. Re-measure on width changes (column count / viewport alter how the
  // text wraps), mirroring the fade-detection in BookmarkTagsBox.
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    const sync = () => setDescriptionOverflows(el.scrollHeight > el.clientHeight + 1);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bookmark.description, showDescription]);

  const showCategory = !!bookmarkCategory && !hidden.has("category");
  const showWebsite = !!website && !hidden.has("website") && !(youtubeChannel && effectiveHideWebsiteForYouTube);
  const showMediaType = !!mediaType && !hidden.has("mediaType");
  const showYoutubeChannel = !!youtubeChannel && !hidden.has("youtubeChannel");
  const showTags = bookmark.tags.length > 0 && !hidden.has("tags");

  return (
    <>
      {showDescription
        ? (
          <div
            ref={descriptionRef}
            className="relative mt-2 max-h-24 overflow-hidden"
          >
            <p className="text-sm/6 text-foreground">{bookmark.description}</p>
            {descriptionOverflows
              ? (
                <div
                  className="
                    pointer-events-none absolute inset-x-0 bottom-0 h-8
                    bg-linear-to-t from-card to-transparent
                  "
                />
              )
              : null}
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
            {valueBadges.map((badge) => {
              const {
                onToggle,
              } = badge;
              return (
                <li key={badge.id}>
                  {onToggle
                    ? (
                      <button
                        type="button"
                        title="Click to toggle"
                        onClick={(event) => {
                          // Don't let the toggle bubble to any surrounding card navigation.
                          event.preventDefault();
                          event.stopPropagation();
                          onToggle();
                        }}
                      >
                        <Badge
                          variant="outline"
                          className="
                            cursor-pointer
                            hover:bg-accent
                          "
                        >
                          {badge.label}
                        </Badge>
                      </button>
                    )
                    : <Badge variant="outline">{badge.label}</Badge>}
                </li>
              );
            })}
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
