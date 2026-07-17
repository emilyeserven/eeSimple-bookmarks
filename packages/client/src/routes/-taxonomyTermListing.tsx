import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { TaxonomyTermNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { tagsForServerQuery } from "../lib/bookmarkSearch";
import { subtreeIds } from "../lib/tagTree";

interface Props {
  term: TaxonomyTermNode;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery). */
  activeView: "bookmarks" | "gallery";
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * The taxonomy-term-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` routes
 * (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`. Mirrors `-genreMoodListing.tsx`, generalized to any taxonomy.
 */
export function TaxonomyTermListing({
  term, activeView, search, onSearchChange,
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
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
  } = useCategoryPageData(tagsForServerQuery(search));

  // Include bookmarks carrying this term or any of its descendants.
  const termIds = new Set(subtreeIds(term));
  const termBookmarks = (bookmarks ?? []).filter(b =>
    b.taxonomyTerms?.some(entry => termIds.has(entry.id)));

  return (
    <BookmarkSearchView
      activeView={activeView}
      pageKey={`taxonomy-term:${term.id}`}
      tree={tagTree ?? []}
      properties={properties ?? []}
      categories={categories ?? []}
      youtubeChannels={youtubeChannels ?? []}
      relationshipTypes={relationshipTypes ?? []}
      people={people ?? []}
      placeTypes={placeTypes ?? []}
      bookmarks={termBookmarks}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks with this term yet.")}
      noMatchMessage={t("No bookmarks with this term match these filters.")}
    />
  );
}
