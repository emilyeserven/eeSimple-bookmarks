import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Author, Bookmark, BookmarkDetailImageSize, BookmarkDetailLayout, BookmarkDetailVideoSize, BookmarkImageVisibility, Category, CustomProperty, MediaType, PropertyGroup, RelationshipType, SidebarOpenModifier, TagNode, ViewMode, Website, YouTubeChannel } from "@eesimple/types";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The user's theme preference. `system` follows the OS `prefers-color-scheme`. */
export type Theme = "light" | "dark" | "system";

/** Per-section image layout preference for 2-column homepage sections. */
export type HomepageSectionImageLayout = "above" | "side";

/**
 * UI-pref unions defined once in `@eesimple/types` and re-exported here so existing
 * `../stores/uiStore` importers keep working. `SidebarOpenModifier` and the bookmark-detail sizing
 * unions now drive server-persisted settings but are still re-exported for back-compat.
 */
export type {
  BookmarkDetailImageSize,
  BookmarkDetailLayout,
  BookmarkDetailVideoSize,
  BookmarkImageVisibility,
  SidebarOpenModifier,
  ViewMode,
};

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
  relationshipTypes?: RelationshipType[];
  authors?: Author[];
  bookmarks: Pick<Bookmark, "numberValues">[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

interface UiState {
  /** The selected theme; persisted to localStorage so it survives reloads. */
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Per-listing image display mode: "natural", "cropped", "square", "opengraph", or a custom ratio UUID. Keyed by a stable page key. */
  bookmarkImageMode: Record<string, string>;
  setBookmarkImageMode: (pageKey: string, mode: string) => void;
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
  /** Replace the hidden card-field list for a page wholesale (used when applying a display preset). */
  setHiddenCardFields: (pageKey: string, fieldKeys: string[]) => void;
  /** The display preset last applied per listing page (drives the "update preset" offer). Keyed by pageKey → preset id. */
  selectedDisplayPreset: Record<string, string>;
  setSelectedDisplayPreset: (pageKey: string, presetId: string) => void;
  /** Persisted per-listing table column widths (px), keyed by pageKey → columnId. */
  tableColumnWidths: Record<string, Record<string, number>>;
  setTableColumnWidths: (pageKey: string, widths: Record<string, number>) => void;
  /** Left sidebar width in rem (10–28). Persisted so the user's drag preference survives reloads. */
  sidebarWidth: number;
  setSidebarWidth: (value: number) => void;
  /** Docked right panel width in rem (18–40). Only applies when the panel is pinned. */
  panelWidth: number;
  setPanelWidth: (value: number) => void;
  /** Section keys currently collapsed in the left sidebar ("categories" | "taxonomies" | "customization" | "management"). */
  collapsedSidebarSections: string[];
  toggleSidebarSection: (section: string) => void;
  /** Whether the Add Bookmark accordion is expanded on Listings pages. Shared across all listing pages. */
  addBookmarkFormOpen: boolean;
  setAddBookmarkFormOpen: (open: boolean) => void;
  /** Whether the Add Import modal is open. */
  addImportModalOpen: boolean;
  setAddImportModalOpen: (open: boolean) => void;
  /** Newsletter id to pre-select when the Add Import modal opens (cleared on close). */
  importModalInitialNewsletterId: string | null;
  setImportModalInitialNewsletterId: (id: string | null) => void;
  /** Section IDs whose bookmark grid is collapsed on the homepage. */
  collapsedHomepageSectionIds: string[];
  toggleHomepageSectionCollapsed: (id: string) => void;
  /** Per-listing image layout for 2-column listing pages: "above" (default) or "side". Keyed by a stable page key. */
  bookmarkImageLayout: Record<string, HomepageSectionImageLayout>;
  setBookmarkImageLayout: (pageKey: string, layout: HomepageSectionImageLayout) => void;
  /** Per-listing toggle (default true) for whether custom properties placed in an image corner are overlaid on card images. Keyed by a stable page key. */
  bookmarkCornerOverlays: Record<string, boolean>;
  setBookmarkCornerOverlays: (pageKey: string, value: boolean) => void;
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
      bookmarkImageMode: {},
      setBookmarkImageMode: (pageKey, mode) => set(state => ({
        bookmarkImageMode: {
          ...state.bookmarkImageMode,
          [pageKey]: mode,
        },
      })),
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
      setHiddenCardFields: (pageKey, fieldKeys) => set(state => ({
        hiddenCardFields: {
          ...state.hiddenCardFields,
          [pageKey]: fieldKeys,
        },
      })),
      selectedDisplayPreset: {},
      setSelectedDisplayPreset: (pageKey, presetId) => set(state => ({
        selectedDisplayPreset: {
          ...state.selectedDisplayPreset,
          [pageKey]: presetId,
        },
      })),
      tableColumnWidths: {},
      setTableColumnWidths: (pageKey, widths) => set(state => ({
        tableColumnWidths: {
          ...state.tableColumnWidths,
          [pageKey]: widths,
        },
      })),
      sidebarWidth: 16,
      setSidebarWidth: value => set({
        sidebarWidth: clampSidebarWidth(value),
      }),
      panelWidth: 28,
      setPanelWidth: value => set({
        panelWidth: clampPanelWidth(value),
      }),
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
      addImportModalOpen: false,
      setAddImportModalOpen: open => set({
        addImportModalOpen: open,
      }),
      importModalInitialNewsletterId: null,
      setImportModalInitialNewsletterId: id => set({
        importModalInitialNewsletterId: id,
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
      bookmarkCornerOverlays: {},
      setBookmarkCornerOverlays: (pageKey, value) => set(state => ({
        bookmarkCornerOverlays: {
          ...state.bookmarkCornerOverlays,
          [pageKey]: value,
        },
      })),
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
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        let s = persistedState as Record<string, unknown>;
        if (version === 0) {
          const old = (s.bookmarkImageMode ?? {}) as Record<string, unknown>;
          const converted: Record<string, string> = {};
          for (const [k, v] of Object.entries(old)) {
            converted[k] = v === true ? "natural" : v === false ? "cropped" : String(v);
          }
          s = {
            ...s,
            bookmarkImageMode: converted,
          };
        }
        return s;
      },
      partialize: state => ({
        theme: state.theme,
        bookmarkImageMode: state.bookmarkImageMode,
        bookmarkImageVisibility: state.bookmarkImageVisibility,
        bookmarkColumns: state.bookmarkColumns,
        viewMode: state.viewMode,
        hiddenCardFields: state.hiddenCardFields,
        selectedDisplayPreset: state.selectedDisplayPreset,
        sidebarWidth: state.sidebarWidth,
        panelWidth: state.panelWidth,
        collapsedSidebarSections: state.collapsedSidebarSections,
        addBookmarkFormOpen: state.addBookmarkFormOpen,
        collapsedHomepageSectionIds: state.collapsedHomepageSectionIds,
        bookmarkImageLayout: state.bookmarkImageLayout,
        bookmarkCornerOverlays: state.bookmarkCornerOverlays,
      }),
    },
  ),
);
