import type { Bookmark } from "@eesimple/types";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface BookmarkGalleryProps {
  bookmark: Bookmark;
}

/**
 * The bookmark Gallery tab: a big image on the left with a vertical strip of thumbnails on the
 * right (shown only when there's more than one kept image) to switch which one is displayed.
 * Capped at 1200px in either dimension so a large source image can't blow out the layout.
 */
export function BookmarkGallery({
  bookmark,
}: BookmarkGalleryProps) {
  const images = bookmark.images;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = images.find(img => img.id === selectedId)
    ?? images.find(img => img.isMain)
    ?? images[0];
  if (!selected) return null;

  return (
    <div className="flex max-h-[1200px] max-w-[1200px] gap-2">
      <img
        src={selected.url}
        alt=""
        loading="lazy"
        className="
          max-h-[1200px] max-w-[1200px] flex-1 rounded-md border object-contain
        "
      />
      {images.length > 1
        ? (
          <div
            className="
              flex max-h-[1200px] w-20 shrink-0 flex-col gap-2 overflow-y-auto
            "
          >
            {images.map(img => (
              <button
                key={img.id}
                type="button"
                aria-label={img.isMain ? "Main image" : "Show image"}
                aria-pressed={img.id === selected.id}
                onClick={() => setSelectedId(img.id)}
                className={cn(
                  `
                    aspect-square w-full shrink-0 overflow-hidden rounded-md
                    border transition
                  `,
                  img.id === selected.id
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
        )
        : null}
    </div>
  );
}
