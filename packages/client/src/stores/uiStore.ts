import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** Per-section image layout preference for 2-column homepage sections. */
export type HomepageSectionImageLayout = "above" | "side";

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
  /** When on, the Images section of the Add Bookmark form starts collapsed and the page image is fetched automatically on save. */
  autoFetchImage: boolean;
  setAutoFetchImage: (value: boolean) => void;
  /** Per-listing image display mode: `true` = natural aspect ratio, `false` = uniform crop. Keyed by a stable page key. */
  bookmarkImageMode: Record<string, boolean>;
  setBookmarkImageMode: (pageKey: string, mode: boolean) => void;
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
  /** Customization item keys hidden in the left sidebar ("custom-properties" | "autofill"). Empty = all visible. */
  hiddenCustomizationItems: string[];
  toggleCustomizationItem: (key: string) => void;
  /** Whether the Add Bookmark accordion is expanded on Listings pages. Shared across all listing pages. */
  addBookmarkFormOpen: boolean;
  setAddBookmarkFormOpen: (open: boolean) => void;
  /** Section IDs whose bookmark grid is collapsed on the homepage. */
  collapsedHomepageSectionIds: string[];
  toggleHomepageSectionCollapsed: (id: string) => void;
  /** Per-section image layout for 2-column homepage sections: "above" (default) or "side". Keyed by section ID. */
  homepageSectionImageLayout: Record<string, HomepageSectionImageLayout>;
  setHomepageSectionImageLayout: (sectionId: string, layout: HomepageSectionImageLayout) => void;
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
      autoFetchImage: true,
      setAutoFetchImage: value => set({
        autoFetchImage: value,
      }),
      bookmarkImageMode: {},
      setBookmarkImageMode: (pageKey, mode) => set(state => ({
        bookmarkImageMode: {
          ...state.bookmarkImageMode,
          [pageKey]: mode,
        },
      })),
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
      hiddenCustomizationItems: [],
      toggleCustomizationItem: key => set(state => ({
        hiddenCustomizationItems: state.hiddenCustomizationItems.includes(key)
          ? state.hiddenCustomizationItems.filter(x => x !== key)
          : [...state.hiddenCustomizationItems, key],
      })),
      addBookmarkFormOpen: true,
      setAddBookmarkFormOpen: open => set({
        addBookmarkFormOpen: open,
      }),
      collapsedHomepageSectionIds: [],
      toggleHomepageSectionCollapsed: id => set(state => ({
        collapsedHomepageSectionIds: state.collapsedHomepageSectionIds.includes(id)
          ? state.collapsedHomepageSectionIds.filter(x => x !== id)
          : [...state.collapsedHomepageSectionIds, id],
      })),
      homepageSectionImageLayout: {},
      setHomepageSectionImageLayout: (sectionId, layout) => set(state => ({
        homepageSectionImageLayout: {
          ...state.homepageSectionImageLayout,
          [sectionId]: layout,
        },
      })),
    }),
    {
      name: "eesimple-ui",
      partialize: state => ({
        theme: state.theme,
        autoFetchTitle: state.autoFetchTitle,
        autoFetchImage: state.autoFetchImage,
        bookmarkImageMode: state.bookmarkImageMode,
        bookmarkColumns: state.bookmarkColumns,
        panelPinned: state.panelPinned,
        sidebarWidth: state.sidebarWidth,
        panelWidth: state.panelWidth,
        hiddenCategoryIds: state.hiddenCategoryIds,
        hiddenTaxonomyItems: state.hiddenTaxonomyItems,
        hiddenCustomizationItems: state.hiddenCustomizationItems,
        addBookmarkFormOpen: state.addBookmarkFormOpen,
        collapsedHomepageSectionIds: state.collapsedHomepageSectionIds,
        homepageSectionImageLayout: state.homepageSectionImageLayout,
      }),
    },
  ),
);
