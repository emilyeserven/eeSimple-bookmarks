import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useGroupBySlug } from "../hooks/useGroups";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/")({
  validateSearch: validateBookmarkSearch,
  component: GroupBookmarksPage,
});

function GroupBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    groupSlug,
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
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="size-6 shrink-0" />
          {group.name}
        </h1>
      )}
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
      onSearchChange={next =>
        navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks for this group yet.")}
      noMatchMessage={t("No bookmarks for this group match these filters.")}
    />
  );
}
