import type { Bookmark, Category, CustomProperty } from "@eesimple/types";

import { formatPropertyValue } from "./bookmarkColumnFormat";
import { BookmarkTagsBox } from "../BookmarkTagsBox";
import { CategoryPill } from "../CategoryPill";
import { MediaTypePill } from "../MediaTypePill";
import { SourcePill } from "../SourcePill";
import { StarRating } from "../StarRating";

/** The category pill cell, resolving the bookmark's non-built-in category from the cached list. */
export function BookmarkCategoryColumnCell({
  bookmark, allCategories,
}: { bookmark: Bookmark;
  allCategories: Category[]; }) {
  const category = (allCategories ?? []).find(
    c => c.id === bookmark.categoryId && !c.builtIn,
  );
  return category ? <CategoryPill category={category} /> : null;
}

/** The source pill cell: YouTube channel takes precedence, then website (unless hidden for YouTube). */
export function BookmarkSourceColumnCell({
  bookmark, hideWebsiteForYouTube, websiteHidden, youtubeChannelHidden,
}: { bookmark: Bookmark;
  hideWebsiteForYouTube: boolean;
  websiteHidden: boolean;
  youtubeChannelHidden: boolean; }) {
  const {
    website, youtubeChannel,
  } = bookmark;
  if (youtubeChannel && !youtubeChannelHidden) {
    return (
      <SourcePill
        type="youtube-channel"
        data={youtubeChannel}
      />
    );
  }
  if (website && !websiteHidden && !(youtubeChannel && hideWebsiteForYouTube)) {
    return (
      <SourcePill
        type="website"
        data={website}
      />
    );
  }
  return null;
}

/** The media-type pill cell. */
export function BookmarkMediaTypeColumnCell({
  bookmark,
}: { bookmark: Bookmark }) {
  return bookmark.mediaType ? <MediaTypePill mediaType={bookmark.mediaType} /> : null;
}

/** The tags cell. */
export function BookmarkTagsColumnCell({
  bookmark,
}: { bookmark: Bookmark }) {
  return bookmark.tags.length > 0 ? <BookmarkTagsBox tags={bookmark.tags} /> : null;
}

/** A custom-property value cell: star rating for rating-scale props, formatted text otherwise. */
export function BookmarkPropertyColumnCell({
  bookmark, property, showIfFalse,
}: { bookmark: Bookmark;
  property: CustomProperty;
  showIfFalse: boolean; }) {
  if (property.type === "ratingScale") {
    const entry = bookmark.numberValues.find(value => value.propertyId === property.id);
    return entry
      ? (
        <StarRating
          value={entry.value}
          max={property.ratingMax ?? 5}
          allowHalf={property.ratingAllowHalf}
          readOnly
          label={property.ratingShowLabel ? (property.ratingLabel ?? undefined) : undefined}
          size={14}
        />
      )
      : null;
  }
  const formatted = formatPropertyValue(bookmark, property, showIfFalse);
  return formatted ? <span className="text-sm">{formatted}</span> : null;
}
