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
