import type { FilterPillsRowProps } from "./FilterPillsRow";
import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { FilterFacetKey } from "../lib/filterFacets";
import type { CustomProperty, Taxonomy } from "@eesimple/types";
import type { TFunction } from "i18next";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { useIsMobile } from "../hooks/use-mobile";
import { useFilterOrder, useMobileHiddenFilters, useOnDemandFilters } from "../hooks/useAppSettings";
import { useUserTaxonomies } from "../hooks/useUserTaxonomies";
import { FILTER_FACETS, applyFilterOrder } from "../lib/filterFacets";
import { computeFilterVisibility } from "../lib/filterVisibility";

/** The facet data + search wiring threaded into each pill's popover body. */
export interface FacetBodyContext {
  data: FilterPillsRowProps;
  search: BookmarkSearch;
  onSearchChange: (next: BookmarkSearch) => void;
  t: TFunction;
}

/** A single ordered filter pill: a standard facet, a custom property, or a user-created taxonomy. */
export type OrderedFilterItem
  = | { kind: "facet";
    key: string;
    facet: { key: FilterFacetKey;
      label: string; }; }
      | { kind: "property";
        key: string;
        property: CustomProperty; }
        | { kind: "taxonomy";
          key: string;
          taxonomy: Taxonomy; };

/**
 * Owns the pill row's derived state so `FilterPillsRow` itself stays template-only (fallow's
 * cognitive-complexity cap is hook-count-driven — see CLAUDE.md's large-form decomposition note).
 * Applies the user's `filterOrder` across facets + properties as one sequence, and — on mobile —
 * layers `mobileHiddenFilters` on top of `onDemandFilters` so mobile-hidden filters are added on
 * demand there (a filter with an active value still shows).
 */
export function useFilterPillsRow(props: FilterPillsRowProps) {
  const {
    search, onSearchChange,
  } = props;
  const {
    t,
  } = useTranslation();
  const onDemand = useOnDemandFilters();
  const filterOrder = useFilterOrder();
  const mobileHidden = useMobileHiddenFilters();
  const isMobile = useIsMobile();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const revealFilter = (key: string) => setAdded(prev => new Set(prev).add(key));

  const effectiveOnDemand = isMobile ? [...onDemand, ...mobileHidden] : onDemand;
  // Self-fetched rather than threaded through every listing route: the taxonomy set is dynamic, so
  // there is no static prop for it (the same reason each taxonomy's picker fetches its own terms).
  const taxonomies = useUserTaxonomies();

  const {
    facetVisible, visibleProperties, visibleTaxonomies, addableFilters,
  } = computeFilterVisibility({
    ...props,
    taxonomies,
  }, search, effectiveOnDemand, added);

  const orderedItems: OrderedFilterItem[] = applyFilterOrder(
    [
      ...FILTER_FACETS
        .filter(facet => facetVisible[facet.key])
        .map(facet => ({
          kind: "facet" as const,
          key: facet.key as string,
          facet,
        })),
      ...visibleProperties.map(property => ({
        kind: "property" as const,
        key: property.id,
        property,
      })),
      ...visibleTaxonomies.map(taxonomy => ({
        kind: "taxonomy" as const,
        key: taxonomy.id,
        taxonomy,
      })),
    ],
    filterOrder,
  );

  const ctx: FacetBodyContext = {
    data: props,
    search,
    onSearchChange,
    t,
  };

  return {
    orderedItems,
    addableFilters,
    revealFilter,
    ctx,
    t,
  };
}
