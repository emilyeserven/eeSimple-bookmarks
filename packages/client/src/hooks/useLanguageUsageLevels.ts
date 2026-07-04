import type {
  CreateLanguageUsageLevelInput,
  LanguageUsageKind,
  UpdateLanguageUsageLevelInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { languageUsageLevelsApi } from "../lib/api/taxonomies";

const LEVELS_KEY = ["language-usage-levels"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/** All usage levels, or just one kind's when `kind` is given. */
export function useLanguageUsageLevels(kind?: LanguageUsageKind) {
  return useQuery({
    queryKey: [...LEVELS_KEY, kind ?? "all"] as const,
    queryFn: () => languageUsageLevelsApi.list(kind),
  });
}

/** Distinct (language, level) pairings across all owners, with counts — for the overview page. */
export function useLanguageUsageAssociations() {
  return useQuery({
    queryKey: [...LEVELS_KEY, "associations"] as const,
    queryFn: () => languageUsageLevelsApi.associations(),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: LEVELS_KEY,
  });
  // A rename/delete ripples into any surface showing usage-level names.
  void queryClient.invalidateQueries({
    queryKey: ["language-usages"],
  });
  void queryClient.invalidateQueries({
    queryKey: BOOKMARKS_KEY,
  });
}

export function useCreateLanguageUsageLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLanguageUsageLevelInput) => languageUsageLevelsApi.create(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateLanguageUsageLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateLanguageUsageLevelInput; }) => languageUsageLevelsApi.update(id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteLanguageUsageLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, reassignTo,
    }: { id: string;
      reassignTo?: string; }) => languageUsageLevelsApi.remove(id, reassignTo),
    onSuccess: () => invalidateAll(queryClient),
  });
}
