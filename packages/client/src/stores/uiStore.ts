import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** Clamp a requested bookmark column count to the supported 1–4 range. */
export function clampColumns(columns: number): number {
  return Math.min(4, Math.max(1, Math.round(columns)));
}

/** Clamp the left sidebar width to the supported 10–28 rem range. */
export function clampSidebarWidth(w: number): number {
  return Math.min(28, Math.max(10, w));
}

/** Clamp the right panel width to the supported 18–40 rem range. */
export function clampPanelWidth(w: number): number {
  return Math.min(40, Math.max(18, w));
}

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** When on, blurring the bookmark URL field auto-fetches the page title. */
  autoFetchTitle: boolean;
  setAutoFetchTitle: (value: boolean) => void;
  /** When on, listing images keep their true aspect ratio; when off they're cropped to a uniform, capped size. */
  maintainImageAspectRatio: boolean;
  setMaintainImageAspectRatio: (value: boolean) => void;
  /** Bookmark grid column count (1–4) per listing page, keyed by a stable page key. */
  bookmarkColumns: Record<string, number>;
  setBookmarkColumns: (pageKey: string, columns: number) => void;
  /** When pinned, the right-hand panel docks as a persistent column instead of a floating drawer. */
  panelPinned: boolean;
  setPanelPinned: (value: boolean) => void;
  /** Left sidebar width in rem (10–28). Persisted so the user's drag preference survives reloads. */
  sidebarWidth: number;
  setSidebarWidth: (value: number) => void;
  /** Docked right panel width in rem (18–40). Only applies when the panel is pinned. */
  panelWidth: number;
  setPanelWidth: (value: number) => void;
  /** Category IDs hidden in the left sidebar. Empty = all visible. */
  hiddenCategoryIds: string[];
  toggleCategoryVisibility: (id: string) => void;
  /** Taxonomy item keys hidden in the left sidebar ("tags" | "websites"). Empty = all visible. */
  hiddenTaxonomyItems: string[];
  toggleTaxonomyItem: (key: string) => void;
  /** Whether the Add Bookmark accordion is expanded on Listings pages. Shared across all listing pages. */
  addBookmarkFormOpen: boolean;
  setAddBookmarkFormOpen: (open: boolean) => void;
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
      maintainImageAspectRatio: true,
      setMaintainImageAspectRatio: value => set({
        maintainImageAspectRatio: value,
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
      sidebarWidth: 16,
      setSidebarWidth: value => set({
        sidebarWidth: clampSidebarWidth(value),
      }),
      panelWidth: 28,
      setPanelWidth: value => set({
        panelWidth: clampPanelWidth(value),
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
      addBookmarkFormOpen: true,
      setAddBookmarkFormOpen: open => set({
        addBookmarkFormOpen: open,
      }),
    }),
    {
      name: "eesimple-ui",
      partialize: state => ({
        theme: state.theme,
        autoFetchTitle: state.autoFetchTitle,
        maintainImageAspectRatio: state.maintainImageAspectRatio,
        bookmarkColumns: state.bookmarkColumns,
        panelPinned: state.panelPinned,
        sidebarWidth: state.sidebarWidth,
        panelWidth: state.panelWidth,
        hiddenCategoryIds: state.hiddenCategoryIds,
        hiddenTaxonomyItems: state.hiddenTaxonomyItems,
        addBookmarkFormOpen: state.addBookmarkFormOpen,
      }),
    },
  ),
);
