import type { Bookmark, BookmarkDetailImageSize, BookmarkDetailVideoSize } from "@eesimple/types";

import { useBookmarkDetailImageSize, useBookmarkDetailVideoSize } from "../hooks/useAppSettings";
import { resolveBookmarkDisplayImage } from "../lib/bookmarkImage";

const IMAGE_SIZE_CLASS: Record<BookmarkDetailImageSize, string> = {
  small: "max-h-40 w-full rounded-md border object-contain @2xl:w-40 @2xl:shrink-0",
  medium: "max-h-72 w-full rounded-md border object-contain @2xl:w-72 @2xl:shrink-0",
  large: "max-h-96 w-full rounded-md border object-contain @2xl:w-96 @2xl:shrink-0",
};

const VIDEO_SIZE_CLASS: Record<BookmarkDetailVideoSize, string> = {
  standard: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-96 @2xl:shrink-0",
  half: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-1/2",
  twoThirds: "aspect-video w-full overflow-hidden rounded-md border @2xl:w-2/3",
  fullwidth: "aspect-video w-full overflow-hidden rounded-md border",
};

interface BookmarkDetailMediaProps {
  bookmark: Bookmark;
  /** The YouTube embed URL for this bookmark, or `null` when it isn't a YouTube video. */
  embedUrl: string | null;
}

/**
 * The bookmark detail media element: a playable YouTube embed when the bookmark is a YouTube video,
 * otherwise its static main image, sized by the user's detail image/video size preferences. Renders
 * `null` when there is no media. Shared by the single-column and tabbed detail layouts. When a
 * bookmark has multiple kept images, browsing them happens in the Gallery tab, not here.
 */
export function BookmarkDetailMedia({
  bookmark, embedUrl,
}: BookmarkDetailMediaProps) {
  const imageSize = useBookmarkDetailImageSize();
  const videoSize = useBookmarkDetailVideoSize();

  if (embedUrl) {
    return (
      <div className={VIDEO_SIZE_CLASS[videoSize]}>
        <iframe
          src={embedUrl}
          title={bookmark.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="size-full"
        />
      </div>
    );
  }

  const displayImage = resolveBookmarkDisplayImage(bookmark);
  if (displayImage) {
    return (
      <img
        src={displayImage.url}
        alt=""
        loading="lazy"
        className={IMAGE_SIZE_CLASS[imageSize]}
      />
    );
  }

  return null;
}
