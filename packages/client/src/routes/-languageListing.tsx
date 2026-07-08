import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCategoryPageData } from "./-categoryPageData";
import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { useLanguageBySlug } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/** The language page's search: the shared bookmark filters plus an optional usage-level slug facet. */
export interface LanguageBookmarkSearch extends BookmarkSearch {
  usageLevel?: string;
}

export function validateLanguageSearch(search: Record<string, unknown>): LanguageBookmarkSearch {
  const usageLevel = typeof search.usageLevel === "string" && search.usageLevel.length > 0
    ? search.usageLevel
    : undefined;
  return {
    ...validateBookmarkSearch(search),
    usageLevel,
  };
}

interface Props {
  languageSlug: string;
  /** Which results view the outer `_hub` strip selected (bookmarks/gallery/media). */
  activeView: "bookmarks" | "gallery";
  search: LanguageBookmarkSearch;
  onSearchChange: (next: LanguageBookmarkSearch) => void;
}

/**
 * The language-scoped bookmarks listing body, shared by the `_hub.index` / `_hub.gallery` / `_hub.media`
 * routes (each passes its own `activeView`). The entity `<h1>` header lives in the `_hub` layout, so this
 * passes none to `BookmarkSearchView`. The optional `?usageLevel=` facet narrows to bookmarks carrying
 * this language at that level and rides on `search` so it survives filter changes.
 */
export function LanguageListing({
  languageSlug, activeView, search, onSearchChange,
}: Props) {
  const {
    t,
  } = useTranslation();

  const {
    language, isLoading: languageLoading,
  } = useLanguageBySlug(languageSlug);
  const {
    data: levels = [],
  } = useLanguageUsageLevels();
  const {
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
    categories,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  if (languageLoading || bookmarksLoading) {
    return <p className="text-muted-foreground">{t("Loading…")}</p>;
  }

  if (!language) {
    return <p className="text-destructive">{t("Language not found.")}</p>;
  }

  // Bookmarks that involve this language via any usage association.
  const languageBookmarks = (bookmarks ?? []).filter(
    b => b.languageUsages.some(u => u.language.id === language.id),
  );

  // The usage-level facet is a friendly slug in the URL; narrow to bookmarks carrying this
  // language at that level. Kept out of the shared `search` so the URL param stays canonical.
  const activeLevel = search.usageLevel
    ? levels.find(l => l.slug === search.usageLevel)
    : undefined;
  const scopedBookmarks = activeLevel
    ? languageBookmarks.filter(b =>
      b.languageUsages.some(u => u.language.id === language.id && u.level.id === activeLevel.id))
    : languageBookmarks;

  return (
    <BookmarkSearchView
      activeView={activeView}
      header={activeLevel
        ? (
          <Badge
            variant="secondary"
            className="gap-1"
          >
            {t("Usage: {{name}}", {
              name: activeLevel.name,
            })}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Clear usage-level filter")}
              className="size-4"
              onClick={() =>
                onSearchChange({
                  ...search,
                  usageLevel: undefined,
                })}
            >
              <X className="size-3" />
            </Button>
          </Badge>
        )
        : undefined}
      pageKey={`language:${languageSlug}`}
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
      bookmarks={scopedBookmarks}
      search={search}
      onSearchChange={next =>
        onSearchChange({
          ...next,
          usageLevel: search.usageLevel,
        })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage={t("No bookmarks in this language yet.")}
      noMatchMessage={t("No bookmarks in this language match these filters.")}
    />
  );
}
