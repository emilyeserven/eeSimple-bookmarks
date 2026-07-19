import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useBookmarksPageData } from "./-bookmarksPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/bookmarks/")({
  validateSearch: validateBookmarkSearch,
  component: BookmarksPage,
});

function BookmarksPage() {
  const {
    t,
  } = useTranslation();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useBookmarksPageData();

  return (
    <BookmarkSearchView
      header={<h1 className="text-2xl font-bold">{t("Bookmarks")}</h1>}
      pageKey="bookmarks"
      tree={tagTree ?? []}
      properties={customProperties ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      websites={websites ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      emptyMessage={t("No bookmarks yet.")}
      noMatchMessage={t("No bookmarks match these filters.")}
    />
  );
}
