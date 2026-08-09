import { useQuery } from "@tanstack/react-query";

import { insightsApi } from "../lib/api/settings";

export const COLLECTION_INSIGHTS_KEY = ["collection-insights"] as const;

/**
 * The Collection Insights dashboard snapshot. A display-only aggregate deliberately outside the
 * cross-entity invalidation graph — refetch-on-mount keeps it fresh enough.
 */
export function useCollectionInsights() {
  return useQuery({
    queryKey: COLLECTION_INSIGHTS_KEY,
    queryFn: insightsApi.get,
    staleTime: 30_000,
  });
}
