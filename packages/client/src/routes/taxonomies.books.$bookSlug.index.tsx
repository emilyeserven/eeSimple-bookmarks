import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useBookBySlug } from "../hooks/useBooks";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/books/$bookSlug/")({
  validateSearch: validateBookmarkSearch,
  component: BookBookmarksPage,
});

function BookBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    bookSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

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
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="size-6 shrink-0" />
          {book.name}
        </h1>
      )}
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
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this book yet.")}
      noMatchMessage={t("No bookmarks for this book match these filters.")}
    />
  );
}
