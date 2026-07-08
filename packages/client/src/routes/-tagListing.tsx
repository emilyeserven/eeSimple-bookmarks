import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery } from "../lib/bookmarkSearch";
import { findAncestorPath, subtreeIds } from "../lib/tagTree";

interface Props {
  tagSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The tag-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function TagListing({
  tagSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    categories,
    properties,
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

  const path = tagTree ? findAncestorPath(tagTree, tagSlug) : null;
  const tag = path?.[path.length - 1];

  // Still resolving the tag tree — wait before deciding the tag is missing.
  if (!tagTree && bookmarksLoading) {
    return <p className="text-muted-foreground">{t("Loading tag…")}</p>;
  }

  if (!tag) {
    return <p className="text-destructive">{t("Tag not found.")}</p>;
  }

  // Include bookmarks tagged with this tag or any of its descendants.
  const tagIds = new Set(subtreeIds(tag));
  const tagBookmarks = (bookmarks ?? []).filter(b => b.tags.some(t => tagIds.has(t.id)));

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`tag:${tagSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      genreMoods={genreMoods ?? []}
      bookmarks={tagBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks with this tag yet.")}
      noMatchMessage={t("No bookmarks with this tag match these filters.")}
    />
  );
}
