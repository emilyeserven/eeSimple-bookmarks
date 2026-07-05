import type {
  CreateTranslationSourceInput,
  UpdateTranslationSourceInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { translationSourcesApi } from "../lib/api/taxonomies";

const SOURCES_KEY = ["translation-sources"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

/** All translation sources. */
export function useTranslationSources() {
  return useQuery({
    queryKey: SOURCES_KEY,
    queryFn: () => translationSourcesApi.list(),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: SOURCES_KEY,
  });
  // A rename/delete ripples into any surface showing translation-source names on language usages.
  void queryClient.invalidateQueries({
    queryKey: ["language-usages"],
  });
  void queryClient.invalidateQueries({
    queryKey: BOOKMARKS_KEY,
  });
}

export function useCreateTranslationSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTranslationSourceInput) => translationSourcesApi.create(input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateTranslationSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateTranslationSourceInput; }) => translationSourcesApi.update(id, input),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteTranslationSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, reassignTo,
    }: { id: string;
      reassignTo?: string; }) => translationSourcesApi.remove(id, reassignTo),
    onSuccess: () => invalidateAll(queryClient),
  });
}
