import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { usePersonBySlug } from "../hooks/usePeople";
import { tagsForServerQuery } from "../lib/bookmarkSearch";

interface Props {
  personSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The person-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`.
 */
export function PersonListing({
  personSlug, activeView, search, onSearchChange,
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
      activeView={activeView}
      pageKey={`person:${personSlug}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
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
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks credited to this person yet.")}
      noMatchMessage={t("No bookmarks credited to this person match these filters.")}
    />
  );
}
