import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Bookmark, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { BookmarkCardGrid } from "./BookmarkCardGrid";
import { BookmarkImageGallery } from "./BookmarkImageGallery";
import { BookmarkPagination } from "./BookmarkPagination";
import { BookmarkTableView } from "./BookmarkTableView";
import { BookmarkBulkActions } from "./bulk/BookmarkBulkActions";
import { BulkActionBar } from "./bulk/BulkActionBar";
import { navLinkClass, navStripClass } from "./TabbedShell";
import { useBookmarksPerPage } from "../hooks/useAppSettings";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { usePageTitleSort } from "../hooks/useTitleSortContext";
import { useViewMode } from "../lib/bookmarkColumns";
import { bookmarkMatchesSearch, hasAnyActiveFilter } from "../lib/bookmarkSearch";
import { sortBookmarks } from "../lib/bookmarkSort";
import { useListingPagination } from "../lib/useListingPagination";
import { useListSelection } from "../lib/useListSelection";
import { cn } from "../lib/utils";
import { useUiStore } from "../stores/uiStore";

interface BookmarkListContentProps {
  pageKey: string;
  columns: number;
  /** The already filter-matched bookmarks to render (non-empty). */
  visibleBookmarks: Bookmark[];
  properties: CustomProperty[];
  addFormCategoryId?: string;
}

/**
 * The matching-bookmarks renderer: owns the view mode + bulk selection, and shows the card-view
 * select toggle, the contextual bulk-action bar, and either the table or the card grid. Split out of
 * `BookmarkListPane` so each component stays under the complexity cap.
 */
function BookmarkListContent({
  pageKey,
  columns,
  visibleBookmarks,
  properties,
  addFormCategoryId,
}: BookmarkListContentProps) {
  const viewMode = useViewMode(pageKey);
  const visibleIds = useMemo(() => visibleBookmarks.map(b => b.id), [visibleBookmarks]);
  const selection = useListSelection(pageKey, visibleIds);
  const onToggleAll = () => (selection.allSelected ? selection.clear() : selection.selectAll());
  const selectedBookmarks = useMemo(
    () => visibleBookmarks.filter(b => selection.isSelected(b.id)),
    [visibleBookmarks, selection],
  );

  return (
    <>
      <BulkActionBar
        count={selection.count}
        totalSelectable={visibleIds.length}
        allSelected={selection.allSelected}
        onSelectAll={selection.selectAll}
        onClear={selection.clear}
      >
        <BookmarkBulkActions
          selectedIds={selection.selectedIds}
          selectedBookmarks={selectedBookmarks}
          properties={properties}
          onDone={selection.clear}
        />
      </BulkActionBar>

      {viewMode === "table"
        ? (
          <BookmarkTableView
            pageKey={pageKey}
            bookmarks={visibleBookmarks}
            properties={properties}
            categoryId={addFormCategoryId}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            allSelected={selection.allSelected}
            anySelected={selection.count > 0}
            onToggleAll={onToggleAll}
          />
        )
        : (
          <BookmarkCardGrid
            bookmarks={visibleBookmarks}
            properties={properties}
            columns={columns}
            selectionMode={selection.mode}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
          />
        )}
    </>
  );
}

interface BookmarkListPaneProps {
  /** Stable listing-page key, used for table column widths and the table view toggle. */
  pageKey: string;
  columns: number;
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  search: BookmarkSearch;
  /** True when the header text search is non-empty, so the "no results" message is correct. */
  textSearchActive?: boolean;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  noMatchMessage: string;
  addFormCategoryId?: string;
  /** Optional content rendered at the top of the list pane (e.g. a location map). */
  afterAddForm?: ReactNode;
  /** When true (default), offer a Bookmarks | Gallery tab strip above the list. */
  showGallery?: boolean;
  /**
   * When set, the pane is **controlled**: it renders only this results view and drops its own
   * `Bookmarks | Gallery` strip (an outer `_hub` strip owns tab selection via the URL). When
   * omitted the pane stays uncontrolled with its internal `useState` strip (the main `/bookmarks` page).
   */
  activeView?: ResultsTab;
}

interface BookmarkListBodyProps {
  pageKey: string;
  columns: number;
  visibleBookmarks: Bookmark[];
  properties: CustomProperty[];
  search: BookmarkSearch;
  hasActiveFilters: boolean;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  noMatchMessage: string;
  addFormCategoryId?: string;
}

/**
 * The bookmarks-tab body: loading/error/empty states, the card-or-table list, and pagination. Split
 * out of {@link BookmarkListPane} so the gallery-tab switch doesn't push the pane over the complexity
 * cap.
 */
function BookmarkListBody({
  pageKey,
  columns,
  visibleBookmarks,
  properties,
  search,
  hasActiveFilters,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
}: BookmarkListBodyProps) {
  const {
    t,
  } = useTranslation();
  const headerSearchQuery = useUiStore(s => s.headerSearchQuery);
  const perPage = useBookmarksPerPage();
  const resetKey = `${pageKey}|${headerSearchQuery}|${JSON.stringify(search)}`;
  const {
    page, totalPages, pageItems, total, rangeStart, rangeEnd, setPage,
  } = useListingPagination(visibleBookmarks, perPage, resetKey);

  return (
    <>
      {isLoading ? <p className="text-muted-foreground">{t("Loading bookmarks…")}</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && visibleBookmarks.length === 0
        ? (
          <p className="text-muted-foreground">
            {hasActiveFilters ? noMatchMessage : emptyMessage}
          </p>
        )
        : null}

      {visibleBookmarks.length > 0
        ? (
          <>
            <BookmarkListContent
              pageKey={pageKey}
              columns={columns}
              visibleBookmarks={pageItems}
              properties={properties}
              addFormCategoryId={addFormCategoryId}
            />
            <BookmarkPagination
              page={page}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              total={total}
              onPageChange={setPage}
            />
          </>
        )
        : null}
    </>
  );
}

type ResultsTab = "bookmarks" | "gallery";

/**
 * The tab strip above the results — Bookmarks and an optional Gallery. Both share the filter
 * sidebar; only the body pane switches. Extracted so `BookmarkListPane` stays under the complexity
 * cap.
 */
function ResultsTabNav({
  tab, onChange, showGallery,
}: {
  tab: ResultsTab;
  onChange: (tab: ResultsTab) => void;
  showGallery: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const tabs: { key: ResultsTab;
    label: string; }[] = [
    {
      key: "bookmarks",
      label: t("Bookmarks"),
    },
    ...(showGallery
      ? [{
        key: "gallery" as const,
        label: t("Gallery"),
      }]
      : []),
  ];

  return (
    <nav
      className={navStripClass}
      aria-label={t("Bookmarks view")}
    >
      {tabs.map(entry => (
        <button
          key={entry.key}
          type="button"
          onClick={() => onChange(entry.key)}
          aria-current={entry.key === tab ? "page" : undefined}
          className={cn(navLinkClass, entry.key === tab && `
            bg-accent text-accent-foreground
          `)}
        >
          {entry.label}
        </button>
      ))}
    </nav>
  );
}

/**
 * Right column of the search view: the matching bookmarks (grid/table) or an image gallery —
 * switched by the tab strip, both sharing the same filtered set.
 */
export function BookmarkListPane({
  pageKey,
  columns,
  bookmarks,
  properties,
  search,
  textSearchActive = false,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
  afterAddForm,
  showGallery = true,
  activeView,
}: BookmarkListPaneProps) {
  useRegisterBulkSelect(pageKey);
  const [tab, setTab] = useState<ResultsTab>("bookmarks");
  const titleSort = usePageTitleSort(pageKey);
  const filtered = bookmarks.filter(bookmark => bookmarkMatchesSearch(bookmark, search));
  const visibleBookmarks = sortBookmarks(filtered, search.sort, properties, titleSort);
  const hasActiveFilters = hasAnyActiveFilter(search) || textSearchActive;
  // Controlled (outer `_hub` URL strip) vs. uncontrolled (own `useState` strip on `/bookmarks`).
  const controlled = activeView != null;
  const rawTab = controlled ? activeView : tab;
  // Guard against a stale "gallery" selection if a page opts out of the gallery.
  const activeTab = rawTab === "gallery" && !showGallery ? "bookmarks" : rawTab;

  return (
    <div className="min-w-0 space-y-6">
      {afterAddForm}

      {controlled
        ? null
        : (
          <ResultsTabNav
            tab={activeTab}
            onChange={setTab}
            showGallery={showGallery}
          />
        )}

      {activeTab === "gallery"
        ? (
          <BookmarkImageGallery
            bookmarks={visibleBookmarks}
            pageKey={pageKey}
          />
        )
        : null}
      {activeTab === "bookmarks"
        ? (
          <BookmarkListBody
            pageKey={pageKey}
            columns={columns}
            visibleBookmarks={visibleBookmarks}
            properties={properties}
            search={search}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            error={error}
            emptyMessage={emptyMessage}
            noMatchMessage={noMatchMessage}
            addFormCategoryId={addFormCategoryId}
          />
        )
        : null}
    </div>
  );
}
