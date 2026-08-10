import type { ComboboxOption } from "./Combobox";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { Taxonomy } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { FacetChips } from "./FilterFacetControls";
import { MultiCombobox } from "./MultiCombobox";
import { useTaxonomyTermTree } from "../hooks/useTaxonomies";
import { withTaxonomyFilterReset, withTaxonomyTerms } from "../lib/bookmarkSearch";
import { flattenTree } from "../lib/tagTree";

/**
 * The picker + selected chips + Reset for one user-created taxonomy's filter. Self-fetches that
 * taxonomy's term tree (one shared cached query per taxonomy) rather than having every listing route
 * thread N term lists down — the taxonomy set is dynamic, so there is no static prop to thread.
 *
 * Terms are depth-indented for a hierarchical taxonomy, matching `TaxonomyAssignmentSection`'s
 * picker. Selection is **exact** (picking a parent does not pull in its children), mirroring the
 * Genres & Moods facet; per-term subtree cascade is a `taxonomy` condition-leaf feature, not a facet
 * one. Hidden entirely in `"missing"` presence mode, where a term selection would be contradictory.
 */
export function TaxonomyFilterBody({
  taxonomy, search, onSearchChange,
}: {
  taxonomy: Taxonomy;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [],
  } = useTaxonomyTermTree(taxonomy.id);

  const options: ComboboxOption[] = flattenTree(tree).map(({
    node, depth,
  }) => ({
    value: node.id,
    label: node.name,
    depth,
    names: node.names,
  }));
  const selected = search.taxonomyTerms?.[taxonomy.id] ?? [];
  const filterActive = selected.length > 0
    || search.taxonomyTermPresence?.[taxonomy.id] !== undefined;

  return (
    <>
      {search.taxonomyTermPresence?.[taxonomy.id] !== "missing"
        ? (
          <>
            <MultiCombobox
              options={options}
              values={selected}
              onValuesChange={ids => onSearchChange(withTaxonomyTerms(search, taxonomy.id, ids))}
              placeholder={t("All {{name}}", {
                name: taxonomy.name.toLowerCase(),
              })}
              aria-label={t("Filter by {{name}}", {
                name: taxonomy.name.toLowerCase(),
              })}
            />
            <FacetChips
              options={options}
              values={selected}
              onValuesChange={ids => onSearchChange(withTaxonomyTerms(search, taxonomy.id, ids))}
            />
          </>
        )
        : null}
      {filterActive
        ? (
          <button
            type="button"
            className="
              text-xs text-primary
              hover:underline
            "
            onClick={() => onSearchChange(withTaxonomyFilterReset(search, taxonomy.id))}
          >
            {t("Reset")}
          </button>
        )
        : null}
    </>
  );
}
