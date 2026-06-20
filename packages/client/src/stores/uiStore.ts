import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, BookmarkImageVisibility, Category, CustomProperty, MediaType, PropertyGroup, TagNode, ViewMode, Website, YouTubeChannel } from "@eesimple/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** Modifier key that, held while clicking an Edit button, opens the item in the right-hand sidebar. */
export type SidebarOpenModifier = "alt" | "ctrl" | "shift" | "meta";

/** Per-section image layout preference for 2-column homepage sections. */
export type HomepageSectionImageLayout = "above" | "side";

/** Bookmark detail page image size preference. */
export type BookmarkDetailImageSize = "small" | "medium" | "large";

/** Bookmark detail page video size preference: constrained side-by-side or full-width stacked. */
export type BookmarkDetailVideoSize = "standard" | "fullwidth";

/**
 * Per-listing image visibility (full card, image-only, or no image) and rendering mode (card grid
 * or a data table). Defined once in `@eesimple/types` and re-exported here so existing
 * `../stores/uiStore` importers keep working.
 */
export type { BookmarkImageVisibility, ViewMode };

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

/** Live filter data and change handler shared from the active listing page to the FiltersPanel. */
export interface FilterContextData {
  tree: TagNode[];
  properties: CustomProperty[];
  propertyGroups?: PropertyGroup[];
  categories?: Category[];
  mediaTypes?: MediaType[];
  youtubeChannels?: YouTubeChannel[];
  websites?: Website[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Modifier held while clicking an Edit button to open the item in the sidebar instead of its page. */
  sidebarOpenModifier: SidebarOpenModifier;
  setSidebarOpenModifier: (value: SidebarOpenModifier) => void;
  /** When on, blurring the bookmark URL field auto-fetches the page title. */
  autoFetchTitle: boolean;
  setAutoFetchTitle: (value: boolean) => void;
  /** When on, the Images section of the Add Bookmark form starts collapsed and the page image is fetched automatically on save. */
  autoFetchImage: boolean;
  setAutoFetchImage: (value: boolean) => void;
  /** Per-listing image display mode: "natural", "cropped", "square", "opengraph", or a custom ratio UUID. Keyed by a stable page key. */
  bookmarkImageMode: Record<string, string>;
  setBookmarkImageMode: (pageKey: string, mode: string) => void;
  /** Width component of the "Cropped" built-in aspect ratio (default 16). */
  croppedWidth: number;
  setCroppedWidth: (value: number) => void;
  /** Height component of the "Cropped" built-in aspect ratio (default 9). */
  croppedHeight: number;
  setCroppedHeight: (value: number) => void;
  /** Per-listing image visibility ("shown" | "image-only" | "off"), keyed by a stable page key. */
  bookmarkImageVisibility: Record<string, BookmarkImageVisibility>;
  setBookmarkImageVisibility: (pageKey: string, value: BookmarkImageVisibility) => void;
  /** Bookmark grid column count (1–4) per listing page, keyed by a stable page key. */
  bookmarkColumns: Record<string, number>;
  setBookmarkColumns: (pageKey: string, columns: number) => void;
  /** Per-listing view mode ("cards" | "table"), keyed by a stable page key. */
  viewMode: Record<string, ViewMode>;
  setViewMode: (pageKey: string, mode: ViewMode) => void;
  /** Card field keys hidden per listing page (standard field key or custom-property id). Empty/absent = all shown. */
  hiddenCardFields: Record<string, string[]>;
  toggleCardField: (pageKey: string, fieldKey: string) => void;
  /** Persisted per-listing table column widths (px), keyed by pageKey → columnId. */
  tableColumnWidths: Record<string, Record<string, number>>;
  setTableColumnWidths: (pageKey: string, widths: Record<string, number>) => void;
  /** When pinned, the right-hand panel docks as a persistent column instead of a floating drawer. */
  panelPinned: boolean;
  setPanelPinned: (value: boolean) => void;
  /** Viewport widths (px) below which the drawer is unpinned (floats) even when panelPinned is true. Default [768] matches the original mobile cutoff. */
  drawerUnpinnedBreakpoints: number[];
  setDrawerUnpinnedBreakpoints: (breakpoints: number[]) => void;
  /** Left sidebar width in rem (10–28). Persisted so the user's drag preference survives reloads. */
  sidebarWidth: number;
  setSidebarWidth: (value: number) => void;
  /** Docked right panel width in rem (18–40). Only applies when the panel is pinned. */
  panelWidth: number;
  setPanelWidth: (value: number) => void;
  /** Category IDs hidden in the left sidebar. Empty = all visible. */
  hiddenCategoryIds: string[];
  toggleCategoryVisibility: (id: string) => void;
  /** Taxonomy item keys hidden in the left sidebar ("tags" | "websites" | "media-types" | "youtube-channels"). Empty = all visible. */
  hiddenTaxonomyItems: string[];
  toggleTaxonomyItem: (key: string) => void;
  /** Customization item keys hidden in the left sidebar ("custom-properties" | "autofill"). Empty = all visible. */
  hiddenCustomizationItems: string[];
  toggleCustomizationItem: (key: string) => void;
  /** Management item keys hidden from the left sidebar ("categories" | "tags"). Empty = all visible. */
  hiddenManagementItems: string[];
  toggleManagementItem: (key: string) => void;
  /** Group keys for entire sidebar sections that are disabled ("categories" | "taxonomies" | "customization" | "management"). Empty = all enabled. */
  hiddenSidebarGroups: string[];
  toggleSidebarGroup: (group: string) => void;
  /** Section keys currently collapsed in the left sidebar ("categories" | "taxonomies" | "customization" | "management"). */
  collapsedSidebarSections: string[];
  toggleSidebarSection: (section: string) => void;
  /** Whether the Add Bookmark accordion is expanded on Listings pages. Shared across all listing pages. */
  addBookmarkFormOpen: boolean;
  setAddBookmarkFormOpen: (open: boolean) => void;
  /** Section IDs whose bookmark grid is collapsed on the homepage. */
  collapsedHomepageSectionIds: string[];
  toggleHomepageSectionCollapsed: (id: string) => void;
  /** Per-listing image layout for 2-column listing pages: "above" (default) or "side". Keyed by a stable page key. */
  bookmarkImageLayout: Record<string, HomepageSectionImageLayout>;
  setBookmarkImageLayout: (pageKey: string, layout: HomepageSectionImageLayout) => void;
  /** When true, listing pages auto-open filters in the right-hand drawer instead of the left column. */
  filtersInDrawer: boolean;
  setFiltersInDrawer: (value: boolean) => void;
  /** When true, the left filter rail is hidden on listing pages; a Show-filters toggle appears in the header. */
  filtersHidden: boolean;
  setFiltersHidden: (value: boolean) => void;
  /** Image size on the bookmark detail page/panel: small (160px), medium (288px, default), or large (384px). */
  bookmarkDetailImageSize: BookmarkDetailImageSize;
  setBookmarkDetailImageSize: (size: BookmarkDetailImageSize) => void;
  /** Video embed size on the bookmark detail page/panel: constrained side-by-side (standard) or full-width stacked (fullwidth). */
  bookmarkDetailVideoSize: BookmarkDetailVideoSize;
  setBookmarkDetailVideoSize: (size: BookmarkDetailVideoSize) => void;
  /** Transient: live filter data from the active listing page. Cleared when leaving a listing page. Never persisted. */
  filterContext: FilterContextData | null;
  setFilterContext: (ctx: FilterContextData | null) => void;
  /** Transient: the current listing page's key, image controls flag, filter-sidebar flag, and whether it renders bookmark cards. Cleared when leaving. Never persisted. */
  listingPage: { key: string;
    showsImages: boolean;
    hasFilters: boolean;
    showsCards: boolean;
    createAction?: () => void; } | null;
  setListingPage: (page: { key: string;
    showsImages: boolean;
    hasFilters: boolean;
    showsCards: boolean;
    createAction?: () => void; } | null) => void;
  /** Transient: true while a listing page with header-search support is mounted. Never persisted. */
  headerSearchActive: boolean;
  setHeaderSearchActive: (active: boolean) => void;
  /** Transient: the live text query from the header search bar. Cleared when leaving the page. Never persisted. */
  headerSearchQuery: string;
  setHeaderSearchQuery: (query: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    set => ({
      theme: "system",
      setTheme: theme => set({
        theme,
      }),
      sidebarOpenModifier: "alt",
      setSidebarOpenModifier: value => set({
        sidebarOpenModifier: value,
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
      croppedWidth: 16,
      setCroppedWidth: value => set({
        croppedWidth: Math.max(1, Math.round(value)),
      }),
      croppedHeight: 9,
      setCroppedHeight: value => set({
        croppedHeight: Math.max(1, Math.round(value)),
      }),
      bookmarkImageVisibility: {},
      setBookmarkImageVisibility: (pageKey, value) => set(state => ({
        bookmarkImageVisibility: {
          ...state.bookmarkImageVisibility,
          [pageKey]: value,
        },
      })),
      bookmarkColumns: {},
      setBookmarkColumns: (pageKey, columns) => set(state => ({
        bookmarkColumns: {
          ...state.bookmarkColumns,
          [pageKey]: clampColumns(columns),
        },
      })),
      viewMode: {},
      setViewMode: (pageKey, mode) => set(state => ({
        viewMode: {
          ...state.viewMode,
          [pageKey]: mode,
        },
      })),
      hiddenCardFields: {},
      toggleCardField: (pageKey, fieldKey) => set((state) => {
        const current = state.hiddenCardFields[pageKey] ?? [];
        return {
          hiddenCardFields: {
            ...state.hiddenCardFields,
            [pageKey]: current.includes(fieldKey)
              ? current.filter(x => x !== fieldKey)
              : [...current, fieldKey],
          },
        };
      }),
      tableColumnWidths: {},
      setTableColumnWidths: (pageKey, widths) => set(state => ({
        tableColumnWidths: {
          ...state.tableColumnWidths,
          [pageKey]: widths,
        },
      })),
      panelPinned: false,
      setPanelPinned: value => set({
        panelPinned: value,
      }),
      drawerUnpinnedBreakpoints: [768],
      setDrawerUnpinnedBreakpoints: breakpoints => set({
        drawerUnpinnedBreakpoints: breakpoints,
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
      hiddenManagementItems: [],
      toggleManagementItem: key => set(state => ({
        hiddenManagementItems: state.hiddenManagementItems.includes(key)
          ? state.hiddenManagementItems.filter(x => x !== key)
          : [...state.hiddenManagementItems, key],
      })),
      hiddenSidebarGroups: [],
      toggleSidebarGroup: group => set(state => ({
        hiddenSidebarGroups: state.hiddenSidebarGroups.includes(group)
          ? state.hiddenSidebarGroups.filter(x => x !== group)
          : [...state.hiddenSidebarGroups, group],
      })),
      collapsedSidebarSections: [],
      toggleSidebarSection: section => set(state => ({
        collapsedSidebarSections: state.collapsedSidebarSections.includes(section)
          ? state.collapsedSidebarSections.filter(x => x !== section)
          : [...state.collapsedSidebarSections, section],
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
      bookmarkImageLayout: {},
      setBookmarkImageLayout: (pageKey, layout) => set(state => ({
        bookmarkImageLayout: {
          ...state.bookmarkImageLayout,
          [pageKey]: layout,
        },
      })),
      filtersInDrawer: false,
      setFiltersInDrawer: value => set({
        filtersInDrawer: value,
      }),
      filtersHidden: false,
      setFiltersHidden: value => set({
        filtersHidden: value,
      }),
      bookmarkDetailImageSize: "medium",
      setBookmarkDetailImageSize: size => set({
        bookmarkDetailImageSize: size,
      }),
      bookmarkDetailVideoSize: "standard",
      setBookmarkDetailVideoSize: size => set({
        bookmarkDetailVideoSize: size,
      }),
      filterContext: null,
      setFilterContext: ctx => set({
        filterContext: ctx,
      }),
      listingPage: null,
      setListingPage: page => set({
        listingPage: page,
      }),
      headerSearchActive: false,
      setHeaderSearchActive: active => set({
        headerSearchActive: active,
      }),
      headerSearchQuery: "",
      setHeaderSearchQuery: query => set({
        headerSearchQuery: query,
      }),
    }),
    {
      name: "eesimple-ui",
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          const s = persistedState as Record<string, unknown>;
          const old = (s.bookmarkImageMode ?? {}) as Record<string, unknown>;
          const converted: Record<string, string> = {};
          for (const [k, v] of Object.entries(old)) {
            converted[k] = v === true ? "natural" : v === false ? "cropped" : String(v);
          }
          return {
            ...s,
            bookmarkImageMode: converted,
          };
        }
        return persistedState;
      },
      partialize: state => ({
        theme: state.theme,
        sidebarOpenModifier: state.sidebarOpenModifier,
        autoFetchTitle: state.autoFetchTitle,
        autoFetchImage: state.autoFetchImage,
        bookmarkImageMode: state.bookmarkImageMode,
        croppedWidth: state.croppedWidth,
        croppedHeight: state.croppedHeight,
        bookmarkImageVisibility: state.bookmarkImageVisibility,
        bookmarkColumns: state.bookmarkColumns,
        viewMode: state.viewMode,
        hiddenCardFields: state.hiddenCardFields,
        panelPinned: state.panelPinned,
        drawerUnpinnedBreakpoints: state.drawerUnpinnedBreakpoints,
        sidebarWidth: state.sidebarWidth,
        panelWidth: state.panelWidth,
        hiddenCategoryIds: state.hiddenCategoryIds,
        hiddenTaxonomyItems: state.hiddenTaxonomyItems,
        hiddenCustomizationItems: state.hiddenCustomizationItems,
        hiddenManagementItems: state.hiddenManagementItems,
        hiddenSidebarGroups: state.hiddenSidebarGroups,
        collapsedSidebarSections: state.collapsedSidebarSections,
        addBookmarkFormOpen: state.addBookmarkFormOpen,
        collapsedHomepageSectionIds: state.collapsedHomepageSectionIds,
        bookmarkImageLayout: state.bookmarkImageLayout,
        filtersInDrawer: state.filtersInDrawer,
        filtersHidden: state.filtersHidden,
        bookmarkDetailImageSize: state.bookmarkDetailImageSize,
        bookmarkDetailVideoSize: state.bookmarkDetailVideoSize,
      }),
    },
  ),
);
