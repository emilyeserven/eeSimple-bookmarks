import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useWebsiteBySlug } from "../hooks/useWebsites";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/")({
  validateSearch: validateBookmarkSearch,
  component: WebsiteBookmarksPage,
});

function WebsiteBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    websiteSlug,
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
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  const {
    website, isLoading: websiteLoading,
  } = useWebsiteBySlug(websiteSlug);

  if (websiteLoading) {
    return <p className="text-muted-foreground">{t("Loading website…")}</p>;
  }

  if (!website) {
    return <p className="text-destructive">{t("Website not found.")}</p>;
  }

  const websiteBookmarks = (bookmarks ?? []).filter(b => b.website?.id === website.id);

  return (
    <BookmarkSearchView
      header={(
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Globe className="size-6 shrink-0" />
            {website.siteName}
          </h1>
          <p className="text-sm text-muted-foreground">{website.domain}</p>
        </div>
      )}
      pageKey={`website:${websiteSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={websiteBookmarks}
      search={search}
      onSearchChange={next => navigate({
        search: next,
        replace: true,
        resetScroll: false,
      })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this website yet.")}
      noMatchMessage={t("No bookmarks for this website match these filters.")}
    />
  );
}
