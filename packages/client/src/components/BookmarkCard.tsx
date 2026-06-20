import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type {
  Bookmark,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CustomProperty,
} from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { BookmarkCardHeader } from "./BookmarkCardHeader";
import { CardImageOverlays } from "./CardImageOverlays";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { useHiddenCardFields } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems } from "../lib/bookmarkCardValues";
import { mergeBooleanValue } from "../lib/bookmarkFormat";
import { bookmarkImageAspectStyle, bookmarkImageClass } from "../lib/bookmarkImage";

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
  /** Image display mode: "natural" (unconstrained), "square" (1:1), "opengraph" (1.91:1), "cropped" (user-configured ratio), or a custom ratio UUID. Defaults to "natural". */
  imageMode?: string;
  /**
   * How the bookmark image participates in the card: `"shown"` (image + content, the default),
   * `"image-only"` (just the image, linked to the bookmark), or `"off"` (content with no image).
   */
  imageVisibility?: BookmarkImageVisibility;
  /** Listing-page key, so the card honors that page's Card Options field toggles. Omitted off listing pages. */
  pageKey?: string;
  /** Explicit hidden field keys, overriding the `pageKey` lookup. Used by DB-backed surfaces (homepage sections). */
  hiddenFields?: Set<string>;
  /** Whether custom properties placed in an image corner are overlaid on the image. When false they fall back to badges. Defaults to true. */
  cornerOverlays?: boolean;
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
  bookmark, properties = [], onDelete, imageLeft = false, imageMode = "natural",
  imageVisibility = "shown", pageKey, hiddenFields, cornerOverlays = true,
}: BookmarkCardProps) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const pageHidden = useHiddenCardFields(pageKey);
  const hidden = hiddenFields ?? pageHidden;
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

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
      onAutoImage={() => autoImage.mutate({
        id: bookmark.id,
        sourceUrl: bookmark.url,
      })}
      onSaveNumber={saveNumber}
      onSaveBoolean={saveBoolean}
      onSaveDateTime={saveDateTime}
      onDelete={onDelete}
    />
  );

  const hasImage = !!bookmark.image && imageVisibility !== "off";

  // Custom properties placed in an image corner are overlaid only when the listing allows it and the
  // card has an image; otherwise their values fall back to badges in BookmarkCardDetails.
  const overlayItems = hasImage && cornerOverlays
    ? buildBookmarkValueItems(bookmark, properties, hidden).filter(item => item.corner !== null)
    : [];
  const cornerPropertyIds = new Set(overlayItems.map(item => item.id));

  const imageEl = hasImage && bookmark.image
    ? (
      <div className={imageLeft ? "relative shrink-0 self-start" : "relative"}>
        <img
          src={bookmark.image.url}
          alt=""
          loading="lazy"
          width={bookmark.image.width}
          height={bookmark.image.height}
          className={bookmarkImageClass(imageLeft, imageMode)}
          style={bookmarkImageAspectStyle(imageMode, croppedWidth, croppedHeight, customRatios)}
        />
        {overlayItems.length > 0 ? <CardImageOverlays items={overlayItems} /> : null}
      </div>
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
      pageKey={pageKey}
      hiddenFields={hiddenFields}
      cornerPropertyIds={cornerPropertyIds}
      onSaveRating={saveNumber}
      onSaveBoolean={saveBoolean}
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
