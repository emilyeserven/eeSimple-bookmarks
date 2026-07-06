import type { BookmarkSearch } from "../lib/bookmarkSearch";

import { useTranslation } from "react-i18next";

import { FilterPill } from "./FilterPill";
import { LanguageUsageFilterBody } from "./FilterSidebarSectionBodies";
import { useLanguages } from "../hooks/useLanguages";
import { useLanguageUsageLevels } from "../hooks/useLanguageUsageLevels";
import { languageUsageHasActiveSelection } from "../lib/filterFacets";

interface LanguageUsageFilterPillProps {
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}

/**
 * Language usage rendered as a pill. Not gated through `FILTER_FACETS`/on-demand/`added` — mirrors
 * the sidebar's `LanguageUsageFilterSection`: self-fetches both vocabularies and renders nothing when
 * neither has any entries, independent of the Settings → Display → Filters on-demand configuration.
 */
export function LanguageUsageFilterPill({
  search, onSearchChange,
}: LanguageUsageFilterPillProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();
  const {
    data: levels = [],
  } = useLanguageUsageLevels();

  if (languages.length === 0 && levels.length === 0) return null;

  return (
    <FilterPill
      label={t("Language usage")}
      active={languageUsageHasActiveSelection(search)}
      summary={{
        count: (search.languageUsageLanguages?.length ?? 0) + (search.languageUsageLevels?.length ?? 0),
      }}
    >
      <LanguageUsageFilterBody
        search={search}
        onSearchChange={onSearchChange}
      />
    </FilterPill>
  );
}
