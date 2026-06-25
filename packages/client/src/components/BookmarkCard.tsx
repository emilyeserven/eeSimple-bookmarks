import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type { Bookmark,
  BookmarkChoicesValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CardFieldZones,
  CardZoneLayouts,
  CustomProperty } from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { BookmarkExternalLinkButton, BookmarkMoreMenu } from "./BookmarkCardActions";
import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { BookmarkCardImage } from "./BookmarkCardImage";
import { buildCardOverlayItems } from "./bookmarkCardOverlays";
import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useAutoBookmarkImage, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCategories } from "../hooks/useCategories";
import { buildBookmarkValueItems, fieldPlacementsForCard } from "../lib/bookmarkCardValues";
import { mergeBooleanValue } from "../lib/bookmarkFormat";
import { buildIsbnLinks } from "../lib/isbnLinks";

import { entityLinkTitle } from "@/lib/sidebarModifier";

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
  /**
   * Per-body-zone layout (flex vs grid) for the card-body sub-zones. Listings pass the rule-resolved
   * layouts; when omitted each zone uses its default arrangement.
   */
  cardZoneLayouts?: CardZoneLayouts;
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

/** Replace the entry for `propertyId` with `values`, or append it when the property has no value yet. */
function mergeChoicesValue(
  values: BookmarkChoicesValue[],
  propertyId: string,
  next: string[],
): BookmarkChoicesValue[] {
  return values.some(entry => entry.propertyId === propertyId)
    ? values.map(entry => (entry.propertyId === propertyId
      ? {
        propertyId,
        values: next,
      }
      : entry))
    : [...values, {
      propertyId,
      values: next,
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
  imageVisibility = "shown", fieldZones, cardZoneLayouts, hideWebsiteForYouTube,
}: BookmarkCardProps) {
  const autoImage = useAutoBookmarkImage();
  const updateBookmark = useUpdateBookmark();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const placements = fieldPlacementsForCard(fieldZones, properties);
  const {
    data: allCategories = [],
  } = useCategories();

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

  function saveChoices(propertyId: string, values: string[]) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        choicesValues: mergeChoicesValue(bookmark.choicesValues, propertyId, values),
      },
    });
  }

  const hasImage = !!bookmark.image && imageVisibility !== "off";

  // Compact Amazon links for any text-typed properties with a non-empty value (e.g. ISBN/ASIN).
  const propById = new Map(properties.map(p => [p.id, p]));
  const isbnLinks = bookmark.textValues.flatMap((entry) => {
    const prop = propById.get(entry.propertyId);
    if (!prop || prop.type !== "text" || !entry.value.trim()) return [];
    return buildIsbnLinks(entry.value).slice(0, 2);
  });

  // Fields placed in an image corner are overlaid only when the card has an image; otherwise they
  // fall back to the card body (BookmarkCardDetails reads the same `placements`).
  const valueItems = buildBookmarkValueItems(bookmark, properties, placements);
  const bookmarkCategory = allCategories.find(c => c.id === bookmark.categoryId && !c.builtIn);
  const overlayItems = hasImage
    ? buildCardOverlayItems(bookmark, valueItems, placements, bookmarkCategory, {
      externalLink: <BookmarkExternalLinkButton url={bookmark.url ?? ""} />,
      more: (
        <BookmarkMoreMenu
          bookmark={bookmark}
          editableProperties={editableProperties}
          autoImagePending={autoImage.isPending}
          onAutoImage={() => autoImage.mutate({
            id: bookmark.id,
            sourceUrl: bookmark.url ?? "",
          })}
          onSaveNumber={saveNumber}
          onSaveBoolean={saveBoolean}
          onSaveDateTime={saveDateTime}
          onSaveChoices={saveChoices}
          onDelete={onDelete}
        />
      ),
    })
    : [];

  const imageEl = hasImage
    ? (
      <BookmarkCardImage
        bookmark={bookmark}
        imageLeft={imageLeft}
        imageMode={imageMode}
        overlayItems={overlayItems}
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
        title={entityLinkTitle(modifier)}
        onClick={event => viewClick(event, "bookmark", bookmark.id, bookmark.id)}
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
      cardZoneLayouts={cardZoneLayouts}
      bookmarkCategory={bookmarkCategory}
      hideWebsiteForYouTube={hideWebsiteForYouTube}
      editableProperties={editableProperties}
      autoImagePending={autoImage.isPending}
      onAutoImage={() => autoImage.mutate({
        id: bookmark.id,
        sourceUrl: bookmark.url ?? "",
      })}
      onSaveNumber={saveNumber}
      onSaveDateTime={saveDateTime}
      onDelete={onDelete}
      onSaveRating={saveNumber}
      onSaveBoolean={saveBoolean}
      onSaveChoices={saveChoices}
    />
  );

  const isbnLinksEl = isbnLinks.length > 0
    ? (
      <div className="flex flex-wrap gap-x-2 gap-y-1 px-3 pb-2 text-xs">
        {isbnLinks.map(link => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              text-muted-foreground underline-offset-2
              hover:text-foreground hover:underline
            "
            onClick={e => e.stopPropagation()}
          >
            {link.label}
          </a>
        ))}
      </div>
    )
    : null;

  if (imageLeft) {
    return (
      <div className="flex gap-4">
        {imageEl}
        <div className="min-w-0 flex-1">
          {details}
          {isbnLinksEl}
        </div>
      </div>
    );
  }

  return (
    <div>
      {imageEl}
      {details}
      {isbnLinksEl}
    </div>
  );
}
