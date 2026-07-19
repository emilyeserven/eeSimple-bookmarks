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
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useViewMode } from "../lib/bookmarkColumns";
import { hasAnyActiveFilter } from "../lib/bookmarkSearch";
import { useListSelection } from "../lib/useListSelection";
import { cn } from "../lib/utils";

interface BookmarkListContentProps {
  pageKey: string;
  columns: number;
  /** The current server page of matching bookmarks (non-empty). */
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
            pageKey={pageKey}
            selectionMode={selection.mode}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
          />
        )}
    </>
  );
}

/** The server-side pager state threaded from `useBookmarkSearchView` into the pane. */
interface BookmarkListPager {
  /** Total matches across all pages (the server's pre-slice count). */
  total: number;
  page: number;
  totalPages: number;
  /** 1-indexed range of the visible page within the total (0/0 when empty). */
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
}

interface BookmarkListPaneProps extends BookmarkListPager {
  /** Stable listing-page key, used for table column widths and the table view toggle. */
  pageKey: string;
  columns: number;
  /** The current server page of matching bookmarks. */
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

interface BookmarkListBodyProps extends BookmarkListPager {
  pageKey: string;
  columns: number;
  /** The current server page of matching bookmarks. */
  visibleBookmarks: Bookmark[];
  properties: CustomProperty[];
  hasActiveFilters: boolean;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
  noMatchMessage: string;
  addFormCategoryId?: string;
}

/**
 * The bookmarks-tab body: loading/error/empty states, the card-or-table list, and pagination. The
 * page slice and total come from the server (`POST /api/bookmarks/search`); this body only renders
 * them. Split out of {@link BookmarkListPane} so the gallery-tab switch doesn't push the pane over
 * the complexity cap.
 */
function BookmarkListBody({
  pageKey,
  columns,
  visibleBookmarks,
  properties,
  hasActiveFilters,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
  total,
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageChange,
}: BookmarkListBodyProps) {
  const {
    t,
  } = useTranslation();

  return (
    <>
      {isLoading ? <p className="text-muted-foreground">{t("Loading bookmarks…")}</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && !error && visibleBookmarks.length === 0
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
              visibleBookmarks={visibleBookmarks}
              properties={properties}
              addFormCategoryId={addFormCategoryId}
            />
            <BookmarkPagination
              page={page}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              total={total}
              onPageChange={onPageChange}
            />
          </>
        )
        : null}
    </>
  );
}

type ResultsTab = "bookmarks" | "gallery";

/**
 * The gallery-tab body: the image grid over the current server page, with the same pager as the
 * list below it. Extracted so `BookmarkListPane` stays under the complexity cap.
 */
function BookmarkGalleryBody({
  pageKey, bookmarks, ...pager
}: BookmarkListPager & {
  pageKey: string;
  bookmarks: Bookmark[];
}) {
  return (
    <>
      <BookmarkImageGallery
        bookmarks={bookmarks}
        pageKey={pageKey}
      />
      {bookmarks.length > 0
        ? (
          <BookmarkPagination
            page={pager.page}
            totalPages={pager.totalPages}
            rangeStart={pager.rangeStart}
            rangeEnd={pager.rangeEnd}
            total={pager.total}
            onPageChange={pager.onPageChange}
          />
        )
        : null}
    </>
  );
}

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
 * switched by the tab strip, both showing the same server page (the gallery pages with the same
 * pager as the list).
 */
export function BookmarkListPane({
  pageKey,
  columns,
  bookmarks,
  properties,
  search,
  textSearchActive = false,
  total,
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  onPageChange,
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
          <BookmarkGalleryBody
            pageKey={pageKey}
            bookmarks={bookmarks}
            total={total}
            page={page}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={onPageChange}
          />
        )
        : null}
      {activeTab === "bookmarks"
        ? (
          <BookmarkListBody
            pageKey={pageKey}
            columns={columns}
            visibleBookmarks={bookmarks}
            properties={properties}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            error={error}
            emptyMessage={emptyMessage}
            noMatchMessage={noMatchMessage}
            addFormCategoryId={addFormCategoryId}
            total={total}
            page={page}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={onPageChange}
          />
        )
        : null}
    </div>
  );
}
