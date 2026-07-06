import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useWebsiteBySlug } from "../hooks/useWebsites";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  websiteSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery" | "media";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The website-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function WebsiteListing({
  websiteSlug, activeView, search, onSearchChange,
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
      activeView={activeView}
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
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this website yet.")}
      noMatchMessage={t("No bookmarks for this website match these filters.")}
    />
  );
}
