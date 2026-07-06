import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { usePersonBySlug } from "../hooks/usePeople";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/")({
  validateSearch: validateBookmarkSearch,
  component: PersonBookmarksPage,
});

function PersonBookmarksPage() {
  const {
    t,
  } = useTranslation();
  const {
    personSlug,
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
    person, isLoading: personLoading,
  } = usePersonBySlug(personSlug);

  if (personLoading) {
    return <p className="text-muted-foreground">{t("Loading…")}</p>;
  }

  if (!person) {
    return <p className="text-destructive">{t("Person not found.")}</p>;
  }

  const personBookmarks = (bookmarks ?? []).filter(b =>
    b.people?.some(entry => entry.id === person.id));

  return (
    <BookmarkSearchView
      header={(
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <UserRound className="size-6 shrink-0" />
          {person.name}
        </h1>
      )}
      pageKey={`person:${personSlug}`}
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
      bookmarks={personBookmarks}
      search={search}
      onSearchChange={next =>
        navigate({
          search: next,
          replace: true,
          resetScroll: false,
        })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks credited to this person yet.")}
      noMatchMessage={t("No bookmarks credited to this person match these filters.")}
    />
  );
}
