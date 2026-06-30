import type { CardOverlayItem } from "./CardImageOverlays";
import type { Bookmark } from "@eesimple/types";

import { ImageOff } from "lucide-react";

import { CardImageOverlays } from "./CardImageOverlays";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { bookmarkImageAspectStyle, bookmarkImageClass } from "../lib/bookmarkImage";

import { Skeleton } from "@/components/ui/skeleton";
import { useCroppedHeight, useCroppedWidth } from "@/hooks/useAppSettings";

interface BookmarkCardImageProps {
  bookmark: Bookmark;
  /** Place the image to the left of the rest of the card (single-column listings) instead of stacked above it. */
  imageLeft: boolean;
  /** Image display mode: "natural", "square", "opengraph", "cropped", or a custom ratio UUID. */
  imageMode: string;
  /** Fields placed in image corners, already rendered to nodes; overlaid on the image when present. */
  overlayItems: CardOverlayItem[];
  /**
   * When true and the bookmark has no image, render a muted placeholder area with a "no image"
   * indicator so image-corner overlays still appear and the empty state is visually clear.
   * Has no effect when the bookmark has an image. Callers omit this when images are disabled or
   * in image-only mode (where no-image falls through to the normal card layout).
   */
  showPlaceholder?: boolean;
  /**
   * When true, the card display rules are still loading. Renders a skeleton in place of the image
   * to avoid an aspect-ratio flash when rules resolve to a non-natural imageMode.
   */
  loading?: boolean;
}

/**
 * The bookmark card's image: the `<img>` sized/styled for the active display mode plus any corner
 * overlays. When loading, renders a pulsing skeleton. When the bookmark has no image and
 * `showPlaceholder` is true, renders a muted placeholder with an "no image" icon so the image
 * area is visually distinct from cards that have images. Returns `null` otherwise.
 */
export function BookmarkCardImage({
  bookmark, imageLeft, imageMode, overlayItems, showPlaceholder = false, loading = false,
}: BookmarkCardImageProps) {
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  const displayImage = bookmark.image ?? bookmark.screenshot;

  // "natural" has no fixed ratio; use opengraph (191:100) for skeleton and placeholder sizing.
  const noRatioFallback = imageMode === "natural" ? "opengraph" : imageMode;

  if (loading) {
    const skeletonClass = imageLeft
      ? "w-32 shrink-0 self-start rounded-md sm:w-40"
      : "mb-2 w-full rounded-md";
    return (
      <Skeleton
        className={skeletonClass}
        style={bookmarkImageAspectStyle(noRatioFallback, croppedWidth, croppedHeight, customRatios)}
      />
    );
  }

  if (!displayImage) {
    if (!showPlaceholder) return null;
    const placeholderClass = imageLeft
      ? "relative flex items-center justify-center w-32 shrink-0 self-start rounded-md border bg-muted sm:w-40"
      : "relative mb-2 flex items-center justify-center w-full rounded-md border bg-muted";
    return (
      <div
        className={placeholderClass}
        style={bookmarkImageAspectStyle(noRatioFallback, croppedWidth, croppedHeight, customRatios)}
      >
        <ImageOff
          className="size-5 text-muted-foreground/40"
          aria-hidden
        />
        <CardImageOverlays items={overlayItems} />
      </div>
    );
  }

  return (
    <div className={imageLeft ? "relative shrink-0 self-start" : "relative"}>
      <img
        src={displayImage.url}
        alt=""
        loading="lazy"
        width={displayImage.width}
        height={displayImage.height}
        className={bookmarkImageClass(imageLeft, imageMode)}
        style={bookmarkImageAspectStyle(imageMode, croppedWidth, croppedHeight, customRatios)}
      />
      {overlayItems.length > 0 ? <CardImageOverlays items={overlayItems} /> : null}
    </div>
  );
}
