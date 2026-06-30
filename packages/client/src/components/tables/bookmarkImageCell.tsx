import type { Bookmark } from "@eesimple/types";

import { useCustomAspectRatios } from "../../hooks/useCustomAspectRatios";
import { bookmarkImageAspectStyle } from "../../lib/bookmarkImage";

import { useCroppedHeight, useCroppedWidth } from "@/hooks/useAppSettings";

/** The image thumbnail cell for the leading image column. Owns the crop/ratio app-settings hooks. */
export function BookmarkImageColumnCell({
  bookmark, imageMode,
}: { bookmark: Bookmark;
  imageMode: string; }) {
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const url = bookmark.image?.url;
  if (!url) return null;
  const aspectStyle = bookmarkImageAspectStyle(imageMode, croppedWidth, croppedHeight, customRatios);
  const isNatural = imageMode === "natural";
  return (
    <div
      className="overflow-hidden rounded-sm"
      style={{
        width: 64,
        ...aspectStyle,
      }}
    >
      <img
        src={url}
        alt=""
        className={isNatural
          ? "h-auto max-h-12 w-full object-contain"
          : "size-full object-contain"}
        loading="lazy"
      />
    </div>
  );
}
