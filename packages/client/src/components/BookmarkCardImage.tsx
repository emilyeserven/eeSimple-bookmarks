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
}

/**
 * The bookmark card's image: the `<img>` sized/styled for the active display mode plus any
 * corner overlays. Returns `null` when the bookmark has no image so callers can fall through to the
 * imageless layout. The aspect styling reads the cropped dimensions and custom ratios itself.
 */
export function BookmarkCardImage({
  bookmark, imageLeft, imageMode, overlayItems,
}: BookmarkCardImageProps) {
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  const displayImage = bookmark.image ?? bookmark.screenshot;
  if (!displayImage) return null;

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
