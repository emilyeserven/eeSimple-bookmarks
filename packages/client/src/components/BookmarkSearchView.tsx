import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Person, Bookmark, Category, CustomProperty, GenreMood, MediaType, PlaceType, RelationshipType, TagNode, Website, YouTubeChannel } from "@eesimple/types";
import type { ReactNode } from "react";

import { BookmarkListPane } from "./BookmarkListPane";
import { BookmarkSortPopover } from "./BookmarkSortPopover";
import { FilterPillsRow } from "./FilterPillsRow";
import { ListingSearchBox } from "./ListingSearchBox";
import { useBookmarkSearchView } from "./useBookmarkSearchView";

interface BookmarkSearchViewProps {
  /** Page heading area rendered above the body. Omitted when an outer `_hub` owns the header. */
  header?: ReactNode;
  /** Stable key identifying the page, so each listing remembers its own column count. */
  pageKey: string;
  tree: TagNode[];
  /** Properties offered as filters and used to render bookmark cards. */
  properties: CustomProperty[];
  /** When provided, groups category-specific property filters under collapsible sections. */
  categories?: Category[];
  /** Media types offered as a multi-select filter in the rail. */
  mediaTypes?: MediaType[];
  /** YouTube channels offered as a multi-select filter in the rail. */
  youtubeChannels?: YouTubeChannel[];
  /** Websites offered as a multi-select filter in the rail. */
  websites?: Website[];
  /** Relationship types offered as a multi-select filter in the rail. */
  relationshipTypes?: RelationshipType[];
  /** People offered as a multi-select filter in the rail. */
  people?: Person[];
  /** Place types offered as a multi-select filter in the rail. */
  placeTypes?: PlaceType[];
  /** Genres & Moods offered as a multi-select filter in the rail. */
  genreMoods?: GenreMood[];
  /** Bookmarks already narrowed by tag (and category, on category pages). */
  bookmarks: Bookmark[];
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  isLoading: boolean;
  error: Error | null;
  /** Message shown when there are no bookmarks and no filter is active. */
  emptyMessage: string;
  /** Message shown when a filter is active but nothing matches it. */
  noMatchMessage: string;
  /**
   * When set, the header Add Bookmark modal is locked to this category and hides its Category
   * picker — used on category pages, where new bookmarks belong to the current category.
   */
  addFormCategoryId?: string;
  /** Optional content rendered at the top of the list pane (e.g. a location map). */
  afterAddForm?: ReactNode;
  /** When true (default), the list pane offers a Bookmarks | Gallery tab strip. */
  showGallery?: boolean;
  /**
   * When set, the results view is **controlled** by the URL (an outer `_hub` strip) — the list pane
   * renders only this view and drops its own strip. Omitted on the main `/bookmarks` page.
   */
  activeView?: "bookmarks" | "gallery";
}

/**
 * Shared layout for the search pages (Bookmarks and each category): the pinnable search box
 * (search + sort + filter pills, via {@link ListingSearchBox}) above the add form and matching
 * bookmark list. Tag filtering is applied upstream (server-side); this view applies the
 * custom-property filters.
 */
export function BookmarkSearchView({
  header,
  pageKey,
  tree,
  properties,
  categories,
  mediaTypes,
  youtubeChannels,
  websites,
  relationshipTypes,
  people,
  placeTypes,
  genreMoods,
  bookmarks,
  search,
  onSearchChange,
  isLoading,
  error,
  emptyMessage,
  noMatchMessage,
  addFormCategoryId,
  afterAddForm,
  showGallery,
  activeView,
}: BookmarkSearchViewProps) {
  const {
    columns, textFilteredBookmarks, textSearchActive,
  } = useBookmarkSearchView({
    pageKey,
    tree,
    properties,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
    bookmarks,
    search,
    onSearchChange,
    addFormCategoryId,
  });

  return (
    <section className="space-y-8">
      {header}

      <ListingSearchBox
        sort={<BookmarkSortPopover label />}
        filters={(
          <FilterPillsRow
            tree={tree}
            properties={properties}
            categories={categories}
            mediaTypes={mediaTypes}
            youtubeChannels={youtubeChannels}
            websites={websites}
            relationshipTypes={relationshipTypes}
            people={people}
            placeTypes={placeTypes}
            genreMoods={genreMoods}
            bookmarks={bookmarks}
            search={search}
            onSearchChange={onSearchChange}
          />
        )}
      />

      <div className="grid gap-8">
        <BookmarkListPane
          pageKey={pageKey}
          columns={columns}
          bookmarks={textFilteredBookmarks}
          properties={properties}
          search={search}
          textSearchActive={textSearchActive}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          noMatchMessage={noMatchMessage}
          addFormCategoryId={addFormCategoryId}
          afterAddForm={afterAddForm}
          showGallery={showGallery}
          activeView={activeView}
        />
      </div>
    </section>
  );
}
