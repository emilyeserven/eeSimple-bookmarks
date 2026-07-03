import type { LanguageUsageOwnerType, UpdateLanguageUsageEntry } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { languageUsagesApi } from "../lib/api/taxonomies";

const usageKey = (ownerType: LanguageUsageOwnerType, ownerId: string) =>
  ["language-usages", ownerType, ownerId] as const;

/** An owner's language usages. */
export function useLanguageUsages(ownerType: LanguageUsageOwnerType, ownerId: string) {
  return useQuery({
    queryKey: usageKey(ownerType, ownerId),
    queryFn: () => languageUsagesApi.get(ownerType, ownerId),
    enabled: ownerId.length > 0,
  });
}

/** Replace an owner's full set of language usages. */
export function useSetLanguageUsages(ownerType: LanguageUsageOwnerType, ownerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: UpdateLanguageUsageEntry[]) =>
      languageUsagesApi.put(ownerType, ownerId, entries),
    onSuccess: (data) => {
      queryClient.setQueryData(usageKey(ownerType, ownerId), data);
      // A bookmark's usages are matchable/hydrated, so refresh bookmark reads too.
      if (ownerType === "bookmark") {
        void queryClient.invalidateQueries({
          queryKey: ["bookmarks"],
        });
      }
    },
  });
}
