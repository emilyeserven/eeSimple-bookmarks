import type { BookmarkSearch } from "@/lib/bookmarkSearch";

import { useState } from "react";

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FilterPillsRow } from "./FilterPillsRow";
import { RowCard } from "./ui/card";
import { Input } from "./ui/input";
import { useBookmarks } from "../hooks/useBookmarks";
import { useBookmarksPageData } from "../routes/-bookmarksPageData";

/**
 * A live, self-contained preview of the listing search box + filter pills, shown above the Display →
 * Filters settings so the user sees how their choices look in real time. It uses the same data hooks
 * the Bookmarks page uses (so conditional facets reflect real data) and the same
 * display-preferences cache the settings toggles write to (so it updates as they edit). Its search
 * state is local and ephemeral — nothing here navigates or persists.
 */
export function DisplayFiltersPreview() {
  const {
    t,
  } = useTranslation();
  const [search, setSearch] = useState<BookmarkSearch>({});
  const {
    tagTree,
    customProperties,
    categories,
    mediaTypes,
    youtubeChannels,
    websites,
    relationshipTypes,
    people,
    placeTypes,
    genreMoods,
  } = useBookmarksPageData();
  // The preview isn't paginated, so it reads the plain list for the data-driven facet gates.
  const {
    data: bookmarks,
  } = useBookmarks();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{t("Preview")}</p>
      <RowCard className="space-y-3 p-3">
        <div className="relative w-full">
          <Search
            className="
              pointer-events-none absolute top-1/2 left-3 size-4
              -translate-y-1/2 text-muted-foreground
            "
          />
          <Input
            type="text"
            placeholder={t("Search…")}
            aria-label={t("Search preview")}
            disabled
            className="px-9"
          />
        </div>
        <FilterPillsRow
          tree={tagTree ?? []}
          properties={customProperties ?? []}
          categories={categories ?? []}
          mediaTypes={mediaTypes ?? []}
          youtubeChannels={youtubeChannels ?? []}
          websites={websites ?? []}
          relationshipTypes={relationshipTypes ?? []}
          people={people ?? []}
          placeTypes={placeTypes ?? []}
          genreMoods={genreMoods ?? []}
          bookmarks={bookmarks ?? []}
          search={search}
          onSearchChange={setSearch}
        />
      </RowCard>
    </div>
  );
}
