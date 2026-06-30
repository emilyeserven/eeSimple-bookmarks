import type { BookmarkCardMenuControls } from "./BookmarkCardActions";
import type { BookmarkImageVisibility } from "../lib/bookmarkColumns";
import type { Bookmark,
  CardFieldZones,
  CardZoneLayouts,
  CustomProperty } from "@eesimple/types";

import { propertyAppliesToCategory } from "@eesimple/types";

import { BookmarkCardDetails } from "./BookmarkCardDetails";
import { BookmarkCardImage } from "./BookmarkCardImage";
import { BookmarkCardImageOnlyLink } from "./BookmarkCardImageOnlyLink";
import { BookmarkCardIsbnLinks } from "./BookmarkCardIsbnLinks";
import { buildBookmarkCardOverlayItems } from "./bookmarkCardOverlayItems";
import { useBookmarkCardSaves } from "./useBookmarkCardSaves";
import { useCategories } from "../hooks/useCategories";
import { buildBookmarkValueItems, fieldPlacementsForCard } from "../lib/bookmarkCardValues";

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

export function BookmarkCard({
  bookmark, properties = [], onDelete, imageLeft = false, imageMode = "natural",
  imageVisibility = "shown", fieldZones, cardZoneLayouts, hideWebsiteForYouTube,
}: BookmarkCardProps) {
  const {
    autoImage, screenshot, saveNumber, saveBoolean, saveDateTime, saveChoices, saveTags,
  } = useBookmarkCardSaves(bookmark);
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

  // Tags opted into the bookmark card's "More" menu quick-toggle.
  const editableTags = bookmark.tags.filter(t => t.editableOnCard);

  const hasActualImage = !!(bookmark.image ?? bookmark.screenshot);
  const imageEnabled = imageVisibility !== "off";
  const hasImage = hasActualImage && imageEnabled;

  // The "More" menu's editable-data + capture controls, shared by the image overlay and the card body.
  const menu: BookmarkCardMenuControls = {
    editableProperties,
    editableTags,
    autoImagePending: autoImage.isPending,
    onAutoImage: () => autoImage.mutate({
      id: bookmark.id,
      sourceUrl: bookmark.url ?? "",
    }),
    screenshotPending: screenshot.isPending,
    onScreenshot: () => screenshot.mutate({
      id: bookmark.id,
    }),
    onSaveNumber: saveNumber,
    onSaveBoolean: saveBoolean,
    onSaveDateTime: saveDateTime,
    onSaveChoices: saveChoices,
    onSaveTags: saveTags,
    onDelete,
  };

  // Fields placed in an image corner render on the image (or placeholder); without an image area
  // they fall back to the card body (BookmarkCardDetails reads the same `placements`).
  const valueItems = buildBookmarkValueItems(bookmark, properties, placements);
  const bookmarkCategory = allCategories.find(c => c.id === bookmark.categoryId && !c.builtIn);
  // Compute overlays whenever the image area is enabled so they appear on placeholders too.
  const overlayItems = imageEnabled
    ? buildBookmarkCardOverlayItems(bookmark, valueItems, placements, bookmarkCategory, menu)
    : [];

  // Show a placeholder only in "shown" mode (not image-only or off) when there is no actual image
  // and at least one overlay item wants to appear — keeps the image area alive for the buttons.
  const showPlaceholder = imageVisibility === "shown" && !hasActualImage && overlayItems.length > 0;
  // Whether a real image or placeholder will render (used for the top-margin gap below).
  const showImageArea = hasImage || showPlaceholder;

  const imageEl = hasImage || showPlaceholder
    ? (
      <BookmarkCardImage
        bookmark={bookmark}
        imageLeft={imageLeft}
        imageMode={imageMode}
        overlayItems={overlayItems}
        showPlaceholder={showPlaceholder}
      />
    )
    : null;

  // Image-only view: render just the image, linked to the bookmark like its title is. A bookmark
  // with no image falls through to the normal card below so the card is never empty.
  if (imageVisibility === "image-only" && imageEl) {
    return (
      <BookmarkCardImageOnlyLink bookmarkId={bookmark.id}>
        {imageEl}
      </BookmarkCardImageOnlyLink>
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
      hasImageAbove={showImageArea && !imageLeft}
      onSaveRating={saveNumber}
      menu={menu}
    />
  );

  const isbnLinksEl = (
    <BookmarkCardIsbnLinks
      bookmark={bookmark}
      properties={properties}
    />
  );

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
