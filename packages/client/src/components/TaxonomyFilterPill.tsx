import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Taxonomy } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { FacetPresenceToggle } from "./FilterFacetControls";
import { FilterPill } from "./FilterPill";
import { TaxonomyFilterBody } from "./TaxonomyFilterBody";
import { withTaxonomyTermPresence } from "../lib/bookmarkSearch";
import { taxonomyHasActiveSelection, taxonomySelectionSummary } from "../lib/filterFacets";

/**
 * One user-created taxonomy rendered as a filter pill: the presence toggle plus the same picker the
 * sidebar section shows, minus the collapsible chrome. The dynamic-taxonomy counterpart to
 * `PropertyFilterPill`.
 */
export function TaxonomyFilterPill({
  taxonomy, search, onSearchChange,
}: {
  taxonomy: Taxonomy;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <FilterPill
      label={taxonomy.name}
      active={taxonomyHasActiveSelection(taxonomy.id, search)}
      summary={taxonomySelectionSummary(taxonomy.id, search)}
      presenceControl={(
        <FacetPresenceToggle
          value={search.taxonomyTermPresence?.[taxonomy.id]}
          onChange={mode => onSearchChange(withTaxonomyTermPresence(search, taxonomy.id, mode))}
          hasLabel={t("Has any")}
          missingLabel={t("Has none")}
        />
      )}
    >
      <TaxonomyFilterBody
        taxonomy={taxonomy}
        search={search}
        onSearchChange={onSearchChange}
      />
    </FilterPill>
  );
}
