import type { BookmarkImageVisibility } from "./bookmarkColumns";
import type { Bookmark, BookmarkCardThumbnailSize, BookmarkImage, CustomAspectRatio } from "@eesimple/types";
import type { CSSProperties } from "react";

/**
 * Width classes for a bookmark card's image-left (row) thumbnail, keyed by the
 * `bookmarkCardThumbnailSize` display preference. "medium" matches the original fixed
 * `w-32 sm:w-40` pair exactly. The stacked layout (`imageLeft: false`) always uses `w-full`
 * regardless of size, since it already scales with the card/grid column width.
 */
const THUMBNAIL_WIDTH_CLASSES: Record<BookmarkCardThumbnailSize, string> = {
  small: "w-24 sm:w-28",
  medium: "w-32 sm:w-40",
  large: "w-40 sm:w-56",
};

/** Width class for a bookmark card's image-left (row) thumbnail at the given size. */
export function bookmarkThumbnailWidthClass(size: BookmarkCardThumbnailSize): string {
  return THUMBNAIL_WIDTH_CLASSES[size];
}

/** Tailwind classes sizing a bookmark card image for the given layout, display mode, and thumbnail size. */
export function bookmarkImageClass(
  imageLeft: boolean,
  imageMode: string,
  size: BookmarkCardThumbnailSize,
): string {
  if (imageLeft) {
    const width = bookmarkThumbnailWidthClass(size);
    return imageMode === "natural"
      ? `h-auto ${width} shrink-0 self-start rounded-md border`
      : `${width} shrink-0 self-start rounded-md border object-cover`;
  }
  return imageMode === "natural"
    ? "mb-2 h-auto w-full rounded-md border"
    : "mb-2 w-full rounded-md border object-cover";
}

/** Inline `aspect-ratio` style for a bookmark card image, resolving built-in and custom ratios. */
export function bookmarkImageAspectStyle(
  imageMode: string,
  croppedW: number,
  croppedH: number,
  customRatios: CustomAspectRatio[],
): CSSProperties {
  if (imageMode === "natural") return {};
  if (imageMode === "square") return {
    aspectRatio: "1 / 1",
  };
  if (imageMode === "opengraph") return {
    aspectRatio: "191 / 100",
  };
  if (imageMode === "cropped") return {
    aspectRatio: `${croppedW} / ${croppedH}`,
  };
  const custom = customRatios.find(r => r.id === imageMode);
  return custom
    ? {
      aspectRatio: `${custom.width} / ${custom.height}`,
    }
    : {};
}

/**
 * Resolves which image a bookmark's cover should display, honoring `imageDisplayPreference`.
 * Falls back to whichever source exists when the preferred one is missing, rather than showing
 * nothing.
 */
export function resolveBookmarkDisplayImage(
  bookmark: Pick<Bookmark, "image" | "screenshot" | "imageDisplayPreference">,
): BookmarkImage | null {
  if (bookmark.imageDisplayPreference === "screenshot") return bookmark.screenshot ?? bookmark.image;
  if (bookmark.imageDisplayPreference === "image") return bookmark.image ?? bookmark.screenshot;
  return bookmark.image ?? bookmark.screenshot;
}

/** The resolved image-area presentation state for a bookmark card. */
export interface BookmarkCardImageState {
  /** True when a real image/screenshot exists for the bookmark. */
  hasActualImage: boolean;
  /** True unless the card's image visibility is `"off"`. */
  imageEnabled: boolean;
  /** True when an actual image both exists and is enabled. */
  hasImage: boolean;
  /** True when a "shown"-mode card has no actual image and should render a placeholder. */
  showPlaceholder: boolean;
  /** True when the image area (real image or placeholder) should render at all. */
  showImageArea: boolean;
}

/**
 * Resolves whether a bookmark card renders an image area, a placeholder, or nothing, from the
 * bookmark's image sources and the card's visibility/loading state. Pure — extracted from
 * `BookmarkCard` so the branching is unit-testable and off the component's complexity budget.
 *
 * While display rules load, only bookmarks with a real image show the area (as a skeleton); a
 * no-image bookmark hides the area until rules resolve, so a placeholder that would immediately
 * disappear (rules setting `imageVisibility="off"`) is never briefly shown.
 */
export function resolveCardImageState(
  bookmark: Pick<Bookmark, "image" | "screenshot" | "imageDisplayPreference">,
  imageVisibility: BookmarkImageVisibility,
  loading: boolean,
): BookmarkCardImageState {
  const hasActualImage = !!resolveBookmarkDisplayImage(bookmark);
  const imageEnabled = imageVisibility !== "off";
  const hasImage = hasActualImage && imageEnabled;
  const showPlaceholder = imageVisibility === "shown" && !hasActualImage;
  const showImageArea = loading
    ? (hasActualImage && imageEnabled)
    : (hasImage || showPlaceholder);
  return {
    hasActualImage,
    imageEnabled,
    hasImage,
    showPlaceholder,
    showImageArea,
  };
}
