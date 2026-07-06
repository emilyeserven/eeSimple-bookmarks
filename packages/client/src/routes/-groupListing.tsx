import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useGroupBySlug } from "../hooks/useGroups";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  groupSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery" | "media";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The group-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function GroupListing({
  groupSlug, activeView, search, onSearchChange,
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
    group, isLoading: groupLoading,
  } = useGroupBySlug(groupSlug);

  if (groupLoading) {
    return <p className="text-muted-foreground">{t("Loading…")}</p>;
  }

  if (!group) {
    return <p className="text-destructive">{t("Group not found.")}</p>;
  }

  const groupBookmarks = (bookmarks ?? []).filter(b =>
    b.group?.id === group.id || b.groups?.some(entry => entry.id === group.id));

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`group:${groupSlug}`}
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
      bookmarks={groupBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this group yet.")}
      noMatchMessage={t("No bookmarks for this group match these filters.")}
    />
  );
}
