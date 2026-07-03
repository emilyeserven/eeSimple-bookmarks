import type {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { languagesApi } from "../lib/api/taxonomies";

const LANGUAGES_KEY = ["languages"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useLanguages() {
  return useQuery({
    queryKey: LANGUAGES_KEY,
    queryFn: languagesApi.list,
  });
}

/** Look up a single language by its slug from the cached list. */
export function useLanguageBySlug(slug: string) {
  const query = useLanguages();
  return {
    ...query,
    language: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLanguageInput) => languagesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: LANGUAGES_KEY,
      });
    },
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateLanguageInput; }) => languagesApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its language name).
      void queryClient.invalidateQueries({
        queryKey: LANGUAGES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => languagesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: LANGUAGES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useBulkDeleteLanguages() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(languagesApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: LANGUAGES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  });
}
