import type { SavedFilter } from "@eesimple/types";

import { useRouterState } from "@tanstack/react-router";

import { useSavedFilterBySlug, useUpdateSavedFilter } from "@/hooks/useSavedFilters";

export interface SavedFilterContext {
  filterId: string | null;
  savedFilter: SavedFilter | undefined;
  updateFilter: ReturnType<typeof useUpdateSavedFilter>;
}

/** Detects whether the user is on a saved-filter page and loads the filter for CMD+K quick-actions. */
export function useSavedFilterContext(): SavedFilterContext {
  const filterSlug = useRouterState({
    select: (state) => {
      const match = /^\/saved-filters\/([^/]+)/.exec(state.location.pathname);
      return match?.[1] ?? null;
    },
  });

  const {
    savedFilter,
  } = useSavedFilterBySlug(filterSlug ?? "");
  const updateFilter = useUpdateSavedFilter();

  return {
    filterId: savedFilter?.id ?? null,
    savedFilter,
    updateFilter,
  };
}
