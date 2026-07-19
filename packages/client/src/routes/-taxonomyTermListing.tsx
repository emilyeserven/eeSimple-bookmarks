import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { TaxonomyTermNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";

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
    tagTree,
    youtubeChannels,
    relationshipTypes,
    people,
    placeTypes,
  } = useCategoryPageData();

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
      scope={{
        kind: "taxonomyTerm",
        id: term.id,
      }}
      search={search}
      onSearchChange={onSearchChange}
      emptyMessage={t("No bookmarks with this term yet.")}
      noMatchMessage={t("No bookmarks with this term match these filters.")}
    />
  );
}
