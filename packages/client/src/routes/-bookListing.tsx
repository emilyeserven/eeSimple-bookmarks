import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useBookBySlug } from "../hooks/useBooks";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  bookSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery" | "media";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The book-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function BookListing({
  bookSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
    propertyGroups,
    bookmarks,
    bookmarksLoading,
    error,
    tagTree,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    book, isLoading: bookLoading,
  } = useBookBySlug(bookSlug);

  if (bookLoading) {
    return <p className="text-muted-foreground">{t("Loading book…")}</p>;
  }

  if (!book) {
    return <p className="text-destructive">{t("Book not found.")}</p>;
  }

  const bookBookmarks = (bookmarks ?? []).filter(b => b.bookId === book.id);

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`book:${bookSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={bookBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this book yet.")}
      noMatchMessage={t("No bookmarks for this book match these filters.")}
    />
  );
}
