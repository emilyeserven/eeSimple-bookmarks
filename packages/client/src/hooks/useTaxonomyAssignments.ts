import type { BookmarkTaxonomyTerm, TaxonomyOwnerType } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { taxonomyAssignmentsApi } from "../lib/api/taxonomies";

const assignmentsKey = (ownerType: TaxonomyOwnerType, ownerId: string) =>
  ["taxonomy-assignments", ownerType, ownerId] as const;

/** All taxonomy terms attached to a single owner (bookmark or taxonomy entity), across all taxonomies. */
export function useOwnerTaxonomyTerms(
  ownerType: TaxonomyOwnerType,
  ownerId: string | undefined,
) {
  return useQuery({
    queryKey: assignmentsKey(ownerType, ownerId ?? ""),
    queryFn: () => taxonomyAssignmentsApi.list(ownerType, ownerId ?? ""),
    enabled: Boolean(ownerId),
  });
}

/** The terms attached to an owner that belong to one taxonomy (from the shared owner query). */
export function useOwnerTaxonomyTermsFor(
  taxonomyId: string,
  ownerType: TaxonomyOwnerType,
  ownerId: string | undefined,
): { terms: BookmarkTaxonomyTerm[];
  isLoading: boolean; } {
  const query = useOwnerTaxonomyTerms(ownerType, ownerId);
  return {
    terms: (query.data ?? []).filter(term => term.taxonomyId === taxonomyId),
    isLoading: query.isLoading,
  };
}

/** Replace the full set of one taxonomy's terms attached to one owner. */
export function useSetOwnerTaxonomyTerms(
  taxonomyId: string,
  ownerType: TaxonomyOwnerType,
  ownerId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (termIds: string[]) =>
      taxonomyAssignmentsApi.set(taxonomyId, ownerType, ownerId, termIds),
    onSuccess: (data) => {
      queryClient.setQueryData(assignmentsKey(ownerType, ownerId), data);
      // Counts on the taxonomy listing change; bookmark reads carry the terms.
      void queryClient.invalidateQueries({
        queryKey: ["taxonomies"],
      });
      if (ownerType === "bookmark") {
        void queryClient.invalidateQueries({
          queryKey: ["bookmarks"],
        });
      }
    },
  });
}
