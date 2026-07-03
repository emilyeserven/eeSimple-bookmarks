import type { Bookmark, BookmarkImage, CustomAspectRatio } from "@eesimple/types";
import type { CSSProperties } from "react";

/** Tailwind classes sizing a bookmark card image for the given layout and display mode. */
export function bookmarkImageClass(imageLeft: boolean, imageMode: string): string {
  if (imageLeft) {
    return imageMode === "natural"
      ? "h-auto w-32 shrink-0 self-start rounded-md border sm:w-40"
      : "w-32 shrink-0 self-start rounded-md border object-cover sm:w-40";
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
