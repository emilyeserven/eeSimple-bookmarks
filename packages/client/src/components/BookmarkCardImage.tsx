import type { CardOverlayItem } from "./CardImageOverlays";
import type { Bookmark } from "@eesimple/types";

import { CardImageOverlays } from "./CardImageOverlays";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { bookmarkImageAspectStyle, bookmarkImageClass } from "../lib/bookmarkImage";

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
   * When true and the bookmark has no image, render a muted placeholder area so image-corner overlays
   * still appear. Has no effect when the bookmark has an image. Callers omit this when images are
   * disabled or in image-only mode (where no-image falls through to the normal card layout).
   */
  showPlaceholder?: boolean;
}

/**
 * The bookmark card's image: the `<img>` sized/styled for the active display mode plus any corner
 * overlays. When the bookmark has no image and `showPlaceholder` is true and there are overlay items,
 * renders a muted placeholder area so the corner overlays still display. Returns `null` otherwise.
 * The aspect styling reads the cropped dimensions and custom ratios itself.
 */
export function BookmarkCardImage({
  bookmark, imageLeft, imageMode, overlayItems, showPlaceholder = false,
}: BookmarkCardImageProps) {
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  const displayImage = bookmark.image ?? bookmark.screenshot;

  if (!displayImage) {
    if (!showPlaceholder || overlayItems.length === 0) return null;
    // Use the configured aspect ratio for the placeholder; fall back to opengraph (191:100) for
    // "natural" mode since there is no intrinsic size without an image.
    const placeholderAspectMode = imageMode === "natural" ? "opengraph" : imageMode;
    const placeholderClass = imageLeft
      ? "relative w-32 shrink-0 self-start rounded-md border bg-muted sm:w-40"
      : "relative mb-2 w-full rounded-md border bg-muted";
    return (
      <div
        className={placeholderClass}
        style={bookmarkImageAspectStyle(placeholderAspectMode, croppedWidth, croppedHeight, customRatios)}
      >
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
