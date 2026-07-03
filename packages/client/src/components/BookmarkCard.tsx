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
import { useHideWebsiteForYouTube } from "../lib/bookmarkCardFields";
import { buildBookmarkValueItems, fieldPlacementsForCard } from "../lib/bookmarkCardValues";
import { resolveBookmarkDisplayImage } from "../lib/bookmarkImage";

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
  /**
   * When true, the card display rules are still being fetched. The image area renders a skeleton
   * (if the bookmark has an image) to avoid an aspect-ratio flash on rule resolution.
   */
  loading?: boolean;
}

export function BookmarkCard({
  bookmark, properties = [], onDelete, imageLeft = false, imageMode = "natural",
  imageVisibility = "shown", fieldZones, cardZoneLayouts, hideWebsiteForYouTube, loading = false,
}: BookmarkCardProps) {
  const {
    autoImage, screenshot, saveNumber, saveBoolean, saveDateTime, saveChoices, saveTags,
  } = useBookmarkCardSaves(bookmark);
  const placements = fieldPlacementsForCard(fieldZones, properties);
  const {
    data: allCategories = [],
  } = useCategories();
  // Listings pass the rule-resolved value explicitly; other surfaces fall back to the Default rule.
  const defaultHideWebsiteForYouTube = useHideWebsiteForYouTube();
  const effectiveHideWebsiteForYouTube = hideWebsiteForYouTube ?? defaultHideWebsiteForYouTube;

  // Properties opted into inline editing from this card, limited to ones that apply to its category.
  // Calculate properties are computed server-side, so they are never editable here.
  const editableProperties = properties.filter(property =>
    property.editableOnCard
    && property.type !== "calculate"
    && propertyAppliesToCategory(property, bookmark.categoryId));

  // Tags opted into the bookmark card's "More" menu quick-toggle.
  const editableTags = bookmark.tags.filter(t => t.editableOnCard);

  const hasActualImage = !!resolveBookmarkDisplayImage(bookmark);
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
    ? buildBookmarkCardOverlayItems(bookmark, valueItems, placements, bookmarkCategory, menu, effectiveHideWebsiteForYouTube)
    : [];

  // Show a placeholder in "shown" mode when there is no actual image — always, so the absence of
  // an image is visually clear rather than just leaving the card with no image area.
  const showPlaceholder = imageVisibility === "shown" && !hasActualImage;
  // While display rules load, only show the image area for bookmarks that have an actual image
  // (rendered as a skeleton). For no-image bookmarks, hide the area until rules resolve so a
  // placeholder that would immediately disappear (if rules set imageVisibility="off") is not shown.
  const showImageArea = loading
    ? (hasActualImage && imageEnabled)
    : (hasImage || showPlaceholder);

  const imageEl = showImageArea
    ? (
      <BookmarkCardImage
        bookmark={bookmark}
        imageLeft={imageLeft}
        imageMode={imageMode}
        overlayItems={overlayItems}
        showPlaceholder={showPlaceholder}
        loading={loading}
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
      <div className="flex flex-1 gap-4">
        {imageEl}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1">{details}</div>
          {isbnLinksEl}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {imageEl}
      <div className="flex-1">{details}</div>
      {isbnLinksEl}
    </div>
  );
}
