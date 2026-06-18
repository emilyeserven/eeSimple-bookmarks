import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { BookmarkCardHeader } from "./BookmarkCardHeader";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";

import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface BookmarkCardProps {
  bookmark: Bookmark;
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  onDelete?: (id: string) => void;
  /**
   * Place the image to the left of the rest of the card (single-column listings) instead of stacked
   * above it (multi-column listings). Defaults to the stacked, image-on-top layout.
   */
  imageLeft?: boolean;
  /** When true, images keep their natural aspect ratio; when false they're cropped to a uniform capped size. Defaults to true. */
  maintainImageAspectRatio?: boolean;
  /**
   * How the bookmark image participates in the card: `"shown"` (image + content, the default),
   * `"image-only"` (just the image, linked to the bookmark), or `"off"` (content with no image).
   */
  imageVisibility?: BookmarkImageVisibility;
}

/**
 * Image classes for the listing card. The aspect-ratio setting constrains a single dimension and lets
 * the other be `auto` (true ratio, never cropped); the uniform setting keeps the capped `object-cover`
 * crop. Each branch is a literal string so Tailwind v4 emits every utility it sees here.
 */
function bookmarkImageClass(imageLeft: boolean, maintainAspectRatio: boolean): string {
  if (imageLeft) {
    return maintainAspectRatio
      ? "h-auto w-32 shrink-0 self-start rounded-md border sm:w-40"
      : "h-24 w-32 shrink-0 self-start rounded-md border object-cover sm:h-28 sm:w-40";
  }
  return maintainAspectRatio
    ? "mb-2 h-auto w-full rounded-md border"
    : "mb-2 max-h-40 w-full rounded-md border object-cover";
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeNumberValue(
  values: BookmarkNumberValue[],
  propertyId: string,
  value: number,
): BookmarkNumberValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeBooleanValue(
  values: BookmarkBooleanValue[],
  propertyId: string,
  value: boolean,
): BookmarkBooleanValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

/** Replace the entry for `propertyId` with `value`, or append it when the property has no value yet. */
function mergeDateTimeValue(
  values: BookmarkDateTimeValue[],
  propertyId: string,
  value: string,
): BookmarkDateTimeValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        value,
      }
      : entry))
    : [...values, {
      propertyId,
      value,
    }];
}

export function BookmarkCard({
  bookmark, properties = [], onDelete, imageLeft = false, maintainImageAspectRatio = true,
  imageVisibility = "shown",
}: BookmarkCardProps) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  // Properties opted into inline editing from this card, limited to ones that apply to its category.
  // Calculate properties are computed server-side, so they are never editable here.
  const editableProperties = properties.filter(property =>
    property.editableOnCard
    && property.type !== "calculate"
    && propertyAppliesToCategory(property, bookmark.categoryId));

  function saveNumber(propertyId: string, value: number) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        numberValues: mergeNumberValue(bookmark.numberValues, propertyId, value),
      },
    });
  }

  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }

  function saveDateTime(propertyId: string, value: string) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        dateTimeValues: mergeDateTimeValue(bookmark.dateTimeValues, propertyId, value),
      },
    });
  }

  const header = (
    <BookmarkCardHeader
      bookmark={bookmark}
      editableProperties={editableProperties}
      autoImagePending={autoImage.isPending}
      onAutoImage={() => autoImage.mutate(bookmark.id)}
      onSaveNumber={saveNumber}
      onSaveBoolean={saveBoolean}
      onSaveDateTime={saveDateTime}
      onDelete={onDelete}
    />
  );

  const imageEl = bookmark.image && imageVisibility !== "off"
    ? (
      <img
        src={bookmark.image.url}
        alt=""
        loading="lazy"
        width={bookmark.image.width}
        height={bookmark.image.height}
        className={bookmarkImageClass(imageLeft, maintainImageAspectRatio)}
      />
    )
    : null;

  // Image-only view: render just the image, linked to the bookmark like its title is. A bookmark
  // with no image falls through to the normal card below so the card is never empty.
  if (imageVisibility === "image-only" && imageEl) {
    return (
      <Link
        to="/bookmarks/$bookmarkId"
        params={{
          bookmarkId: bookmark.id,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "bookmark", bookmark.id)}
        className="block"
      >
        {imageEl}
      </Link>
    );
  }

  const details = (
    <BookmarkCardDetails
      bookmark={bookmark}
      properties={properties}
    />
  );

  if (imageLeft) {
    return (
      <div className="flex gap-4">
        {imageEl}
        <div className="min-w-0 flex-1">
          {header}
          {details}
        </div>
      </div>
    );
  }

  return (
    <div>
      {imageEl}
      {header}
      {details}
    </div>
  );
}
