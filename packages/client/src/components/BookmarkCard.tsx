import type { CardOverlayItem } from "./CardImageOverlays";
import type { BookmarkValueItem } from "../lib/bookmarkCardValues";
import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type { Bookmark,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CardFieldZones,
  CustomProperty,
  Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { Globe, MonitorPlay } from "lucide-react";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { BookmarkCardHeader } from "./BookmarkCardHeader";
import { CardImageOverlays } from "./CardImageOverlays";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { StarRating } from "./StarRating";
import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { STANDARD_CARD_FIELDS } from "../lib/bookmarkCardFieldDefs";
import {
  buildBookmarkValueItems,
  fieldPlacementsForCard,
  standardFieldOverlayLabel,
} from "../lib/bookmarkCardValues";
import { mergeBooleanValue } from "../lib/bookmarkFormat";
import { bookmarkImageAspectStyle, bookmarkImageClass } from "../lib/bookmarkImage";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A translucent corner-overlay badge composing an optional icon/image with optional text. */
function overlayBadge(icon: ReactNode, text: ReactNode): ReactNode {
  return (
    <Badge
      variant="secondary"
      className="
        inline-flex items-center gap-1 bg-background/85 backdrop-blur-sm
      "
    >
      {icon}
      {text}
    </Badge>
  );
}

/** The icon/image shown for a standard field in an image overlay, or `null` when it has none. */
function standardFieldOverlayIcon(
  bookmark: Bookmark,
  key: string,
  category: Category | undefined,
): ReactNode {
  switch (key) {
    case "category":
      return category
        ? (
          <CategoryIcon
            name={category.icon}
            className="size-3 shrink-0"
          />
        )
        : null;
    case "website":
      return bookmark.website?.imageUrl
        ? (
          <img
            src={bookmark.website.imageUrl}
            alt=""
            className="size-3 shrink-0 object-contain"
          />
        )
        : <Globe className="size-3 shrink-0" />;
    case "mediaType":
      return bookmark.mediaType
        ? (
          <CategoryIcon
            name={bookmark.mediaType.icon}
            className="size-3 shrink-0"
          />
        )
        : null;
    case "youtubeChannel":
      return bookmark.youtubeChannel?.imageUrl
        ? (
          <img
            src={bookmark.youtubeChannel.imageUrl}
            alt=""
            className="size-3 shrink-0 rounded-full object-cover"
          />
        )
        : <MonitorPlay className="size-3 shrink-0" />;
    default:
      return null;
  }
}

/**
 * Render a custom-property value item as a translucent corner-overlay node. Ratings show compact
 * stars; image values show a thumbnail (unless `hideIcon`) plus the property name (unless
 * `hideLabel`); other values show their formatted label. Returns `null` when nothing remains to show.
 */
function valueItemOverlayNode(item: BookmarkValueItem): ReactNode {
  if (item.kind === "rating") {
    return (
      <div
        className="rounded-md bg-background/85 px-1.5 py-0.5 backdrop-blur-sm"
      >
        <StarRating
          value={item.value}
          max={item.property.ratingMax ?? 5}
          allowHalf={item.property.ratingAllowHalf}
          allowZero={item.property.ratingAllowZero}
          readOnly
          size={12}
        />
      </div>
    );
  }
  const icon = !item.hideIcon && item.imageUrl
    ? (
      <img
        src={item.imageUrl}
        alt=""
        className="size-4 shrink-0 rounded-sm object-cover"
      />
    )
    : null;
  // For an image value the label is the property name; honor hideLabel. Non-image labels already
  // reflect hideLabel (built in buildBookmarkValueItems).
  const text = item.imageUrl
    ? (item.hideLabel ? null : item.name)
    : item.label;
  if (!icon && !text) return null;
  return overlayBadge(icon, text);
}

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
  /**
   * Per-zone field placements governing which fields show and where (card body vs. image corners).
   * Listings pass the rule-resolved zones; when omitted every field defaults to the card body.
   */
  fieldZones?: CardFieldZones;
  /** When true, hide the website pill on a bookmark that also has a YouTube channel. When omitted, the Default rule's value applies. */
  hideWebsiteForYouTube?: boolean;
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
  imageVisibility = "shown", fieldZones, hideWebsiteForYouTube,
}: BookmarkCardProps) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const placements = fieldPlacementsForCard(fieldZones, properties);
  const {
    data: allCategories = [],
  } = useCategories();
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

  // Fields placed in an image corner are overlaid only when the card has an image; otherwise they
  // fall back to the card body (BookmarkCardDetails reads the same `placements`).
  const valueItems = buildBookmarkValueItems(bookmark, properties, placements);
  const bookmarkCategory = allCategories.find(c => c.id === bookmark.categoryId && !c.builtIn);
  const overlayItems: CardOverlayItem[] = [];
  if (hasImage) {
    for (const item of valueItems) {
      if (item.corner === null) continue;
      const node = valueItemOverlayNode(item);
      if (!node) continue;
      overlayItems.push({
        key: item.id,
        corner: item.corner,
        scale: item.scale,
        mobileScale: item.mobileScale,
        node,
      });
    }
    for (const field of STANDARD_CARD_FIELDS) {
      const placement = placements.get(field.key);
      if (!placement || placement.corner === null) continue;
      const label = standardFieldOverlayLabel(bookmark, field.key, bookmarkCategory?.name ?? null);
      if (!label) continue;
      // Icons/images show by default; the rule's per-field checkboxes hide the icon and/or the text.
      const icon = placement.hideIcon ? null : standardFieldOverlayIcon(bookmark, field.key, bookmarkCategory);
      const text = placement.hideLabel ? null : label;
      if (!icon && !text) continue;
      overlayItems.push({
        key: field.key,
        corner: placement.corner,
        scale: placement.scale,
        mobileScale: placement.mobileScale,
        node: overlayBadge(icon, text),
      });
    }
  }

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
      placements={placements}
      bookmarkCategory={bookmarkCategory}
      hideWebsiteForYouTube={hideWebsiteForYouTube}
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
