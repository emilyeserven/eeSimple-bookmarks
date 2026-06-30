import type { Bookmark, BookmarkDetailImageSize, BookmarkDetailVideoSize } from "@eesimple/types";

import { useState } from "react";

import { useBookmarkDetailImageSize, useBookmarkDetailVideoSize } from "../hooks/useAppSettings";

import { cn } from "@/lib/utils";

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
 * otherwise its static image, sized by the user's detail image/video size preferences. Renders
 * `null` when there is no media. Shared by the single-column and tabbed detail layouts.
 */
export function BookmarkDetailMedia({
  bookmark, embedUrl,
}: BookmarkDetailMediaProps) {
  const imageSize = useBookmarkDetailImageSize();
  const videoSize = useBookmarkDetailVideoSize();
  // Which of several kept images is shown (defaults to the main); only used for the gallery strip.
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // Prefer the user-selected gallery image, then the main image, then the screenshot fallback.
  const selected = bookmark.images.find(img => img.id === selectedId);
  const displayImage = selected ?? bookmark.image ?? bookmark.screenshot;
  if (displayImage) {
    // Multiple kept images get a thumbnail strip below the main image to switch which is shown.
    if (bookmark.images.length > 1) {
      return (
        <div className="flex flex-col gap-2">
          <img
            src={displayImage.url}
            alt=""
            loading="lazy"
            className={IMAGE_SIZE_CLASS[imageSize]}
          />
          <div className="flex flex-wrap gap-2">
            {bookmark.images.map(img => (
              <button
                key={img.id}
                type="button"
                aria-label={img.isMain ? "Main image" : "Show image"}
                aria-pressed={img.id === displayImage.id}
                onClick={() => setSelectedId(img.id)}
                className={cn(
                  "size-14 overflow-hidden rounded-md border transition",
                  img.id === displayImage.id
                    ? "ring-2 ring-primary"
                    : `
                      opacity-70
                      hover:opacity-100
                    `,
                )}
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      );
    }
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
