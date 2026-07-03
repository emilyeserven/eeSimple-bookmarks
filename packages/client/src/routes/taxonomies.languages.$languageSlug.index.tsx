import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { createFileRoute } from "@tanstack/react-router";
import { Languages, X } from "lucide-react";

import { BookmarkSearchView } from "../components/BookmarkSearchView";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useLanguageBySlug } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { tagsForServerQuery, validateBookmarkSearch } from "../lib/bookmarkSearch";
import { useCategoryPageData } from "../routes/-categoryPageData";

/** The language page's search: the shared bookmark filters plus an optional usage-level slug facet. */
interface LanguageBookmarkSearch extends BookmarkSearch {
  usageLevel?: string;
}

function validateLanguageSearch(search: Record<string, unknown>): LanguageBookmarkSearch {
  const usageLevel = typeof search.usageLevel === "string" && search.usageLevel.length > 0
    ? search.usageLevel
    : undefined;
  return {
    ...validateBookmarkSearch(search),
    usageLevel,
  };
}

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/")({
  validateSearch: validateLanguageSearch,
  component: LanguageBookmarksPage,
});

function LanguageBookmarksPage() {
  const {
    languageSlug,
  } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const {
    language, isLoading: languageLoading,
  } = useLanguageBySlug(languageSlug);
  const {
    data: levels = [],
  } = useLanguageUsageLevels();
  const {
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
    categories,
    genreMoods,
  } = useCategoryPageData(tagsForServerQuery(search));

  if (languageLoading || bookmarksLoading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (!language) {
    return <p className="text-destructive">Language not found.</p>;
  }

  // Bookmarks that involve this language — as the primary language or via any usage association.
  const languageBookmarks = (bookmarks ?? []).filter(
    b => b.language?.id === language.id
      || b.languageUsages.some(u => u.language.id === language.id),
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
      header={(
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Languages className="size-6 shrink-0" />
            {language.name}
          </h1>
          {activeLevel
            ? (
              <Badge
                variant="secondary"
                className="gap-1"
              >
                {`Usage: ${activeLevel.name}`}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Clear usage-level filter"
                  className="size-4"
                  onClick={() =>
                    navigate({
                      search: prev => ({
                        ...prev,
                        usageLevel: undefined,
                      }),
                      replace: true,
                      resetScroll: false,
                    })}
                >
                  <X className="size-3" />
                </Button>
              </Badge>
            )
            : null}
        </div>
      )}
      pageKey={`language:${languageSlug}`}
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
      bookmarks={scopedBookmarks}
      search={search}
      onSearchChange={next =>
        navigate({
          search: {
            ...next,
            usageLevel: search.usageLevel,
          },
          replace: true,
          resetScroll: false,
        })}
      isLoading={bookmarksLoading}
      error={error}
      emptyMessage="No bookmarks in this language yet."
      noMatchMessage="No bookmarks in this language match these filters."
    />
  );
}
