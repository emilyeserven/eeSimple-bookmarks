import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** Clamp a requested bookmark column count to the supported 1–4 range. */
export function clampColumns(columns: number): number {
  return Math.min(4, Math.max(1, Math.round(columns)));
}

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** When on, blurring the bookmark URL field auto-fetches the page title. */
  autoFetchTitle: boolean;
  setAutoFetchTitle: (value: boolean) => void;
  /** Bookmark grid column count (1–4) per listing page, keyed by a stable page key. */
  bookmarkColumns: Record<string, number>;
  setBookmarkColumns: (pageKey: string, columns: number) => void;
  /** When pinned, the right-hand panel docks as a persistent column instead of a floating drawer. */
  panelPinned: boolean;
  setPanelPinned: (value: boolean) => void;
  /** Category IDs hidden in the left sidebar. Empty = all visible. */
  hiddenCategoryIds: string[];
  toggleCategoryVisibility: (id: string) => void;
  /** Taxonomy item keys hidden in the left sidebar ("tags" | "websites"). Empty = all visible. */
  hiddenTaxonomyItems: string[];
  toggleTaxonomyItem: (key: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      theme: "system",
      setTheme: theme => set({
        theme,
      }),
      autoFetchTitle: true,
      setAutoFetchTitle: value => set({
        autoFetchTitle: value,
      }),
      bookmarkColumns: {},
      setBookmarkColumns: (pageKey, columns) => set(state => ({
        bookmarkColumns: {
          ...state.bookmarkColumns,
          [pageKey]: clampColumns(columns),
        },
      })),
      panelPinned: false,
      setPanelPinned: value => set({
        panelPinned: value,
      }),
      hiddenCategoryIds: [],
      toggleCategoryVisibility: id => set(state => ({
        hiddenCategoryIds: state.hiddenCategoryIds.includes(id)
          ? state.hiddenCategoryIds.filter(x => x !== id)
          : [...state.hiddenCategoryIds, id],
      })),
      hiddenTaxonomyItems: [],
      toggleTaxonomyItem: key => set(state => ({
        hiddenTaxonomyItems: state.hiddenTaxonomyItems.includes(key)
          ? state.hiddenTaxonomyItems.filter(x => x !== key)
          : [...state.hiddenTaxonomyItems, key],
      })),
    }),
    {
      name: "eesimple-ui",
      partialize: state => ({
        theme: state.theme,
        autoFetchTitle: state.autoFetchTitle,
        bookmarkColumns: state.bookmarkColumns,
        panelPinned: state.panelPinned,
        hiddenCategoryIds: state.hiddenCategoryIds,
        hiddenTaxonomyItems: state.hiddenTaxonomyItems,
      }),
    },
  ),
);
