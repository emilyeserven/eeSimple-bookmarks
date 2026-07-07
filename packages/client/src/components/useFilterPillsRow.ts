import type { FilterPillsRowProps } from "./FilterPillsRow";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { TFunction } from "i18next";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useOnDemandFilters } from "../hooks/useAppSettings";
import { FILTER_FACETS } from "../lib/filterFacets";
import { computeFilterVisibility } from "../lib/filterVisibility";

/** The facet data + search wiring threaded into each pill's popover body. */
export interface FacetBodyContext {
  data: FilterPillsRowProps;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  t: TFunction;
}

/**
 * Owns the pill row's derived state so `FilterPillsRow` itself stays template-only (fallow's
 * cognitive-complexity cap is hook-count-driven — see CLAUDE.md's large-form decomposition note).
 */
export function useFilterPillsRow(props: FilterPillsRowProps) {
  const {
    search, onSearchChange,
  } = props;
  const {
    t,
  } = useTranslation();
  const onDemand = useOnDemandFilters();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const revealFilter = (key: string) => setAdded(prev => new Set(prev).add(key));

  const {
    facetVisible, visibleProperties, addableFilters,
  } = computeFilterVisibility(props, search, onDemand, added);

  const visibleFacets = FILTER_FACETS.filter(facet => facetVisible[facet.key]);

  const ctx: FacetBodyContext = {
    data: props,
    search,
    onSearchChange,
    t,
  };

  return {
    visibleFacets,
    visibleProperties,
    addableFilters,
    revealFilter,
    ctx,
    t,
  };
}
