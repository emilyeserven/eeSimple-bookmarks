import type { MediaObject } from "@eesimple/types";

/** How thumbnails are laid out in the grid view: true aspect ratio (masonry) or uniform squares. */
export type GalleryLayout = "natural" | "square";

/** Which presentation the Media Management page shows: the thumbnail grid or the data table. */
export type GalleryView = "grid" | "table";

/** Human-readable byte size, or a dash when unknown. */
export function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** Whether a manifest object is a video (an archived reel) rather than an image. */
export function isVideoObject(object: MediaObject): boolean {
  return object.contentType?.startsWith("video/") ?? false;
}
