import type { BookmarkImageVisibility, HomepageSectionImageLayout } from "../stores/uiStore";

import { useIsMobile } from "../hooks/use-mobile";
import { useUiStore } from "../stores/uiStore";

/** Default bookmark grid column count for a listing page that has no saved preference. */
export const DEFAULT_BOOKMARK_COLUMNS = 2;

/** Supported column counts offered by the on-page switcher. */
export const COLUMN_OPTIONS = [1, 2, 3, 4] as const;

/**
 * Static Tailwind grid-column classes per count. Listed as literals because Tailwind v4 only
 * emits class names it can see in source — a dynamic `grid-cols-${n}` would never be generated.
 */
export const COLUMN_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

/** The chosen column count for a listing page, falling back to the default. */
export function useBookmarkColumns(pageKey: string): number {
  return useUiStore(state => state.bookmarkColumns[pageKey] ?? DEFAULT_BOOKMARK_COLUMNS);
}

/** Default image display mode for a listing page (natural aspect ratio). */
export const DEFAULT_BOOKMARK_IMAGE_MODE = true;

/** The chosen image display mode for a listing page: `true` = natural ratio, `false` = uniform crop. */
export function useBookmarkImageMode(pageKey: string): boolean {
  return useUiStore(state => state.bookmarkImageMode?.[pageKey] ?? DEFAULT_BOOKMARK_IMAGE_MODE);
}

export type { BookmarkImageVisibility, HomepageSectionImageLayout };

/** Default image visibility for a listing page (full card with image shown). */
export const DEFAULT_BOOKMARK_IMAGE_VISIBILITY: BookmarkImageVisibility = "shown";

/** The chosen image visibility for a listing page: full card, image-only, or no image. */
export function useBookmarkImageVisibility(pageKey: string): BookmarkImageVisibility {
  return useUiStore(
    state => state.bookmarkImageVisibility?.[pageKey] ?? DEFAULT_BOOKMARK_IMAGE_VISIBILITY,
  );
}

/** Default image layout for a 2-column listing page. */
export const DEFAULT_BOOKMARK_IMAGE_LAYOUT: HomepageSectionImageLayout = "above";

/** The resolved image layout for a listing page, incorporating the mobile-default logic. */
export function useBookmarkImageLayout(pageKey: string): HomepageSectionImageLayout {
  const columns = useBookmarkColumns(pageKey);
  const stored = useUiStore(state => state.bookmarkImageLayout[pageKey]);
  const isMobile = useIsMobile();
  return stored ?? (columns === 1 && !isMobile ? "side" : DEFAULT_BOOKMARK_IMAGE_LAYOUT);
}
