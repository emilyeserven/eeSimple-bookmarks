import type { CreateNewsletterInput, UpdateNewsletterInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { newslettersApi } from "../lib/api/imports";

const NEWSLETTERS_KEY = ["newsletters"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useNewsletters() {
  return useQuery({
    queryKey: NEWSLETTERS_KEY,
    queryFn: newslettersApi.list,
  });
}

/** Look up a single newsletter by its slug from the cached list. */
export function useNewsletterBySlug(slug: string) {
  const query = useNewsletters();
  return {
    ...query,
    newsletter: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Look up a single newsletter by its id from the cached list. */
export function useNewsletterById(id: string | null | undefined) {
  const query = useNewsletters();
  return {
    ...query,
    newsletter: id ? (query.data ?? []).find(item => item.id === id) : undefined,
  };
}

export function useCreateNewsletter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNewsletterInput) => newslettersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: NEWSLETTERS_KEY,
      });
    },
  });
}

export function useUpdateNewsletter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateNewsletterInput; }) => newslettersApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its newsletter).
      void queryClient.invalidateQueries({
        queryKey: NEWSLETTERS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteNewsletter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => newslettersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: NEWSLETTERS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useBulkDeleteNewsletters() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(newslettersApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: NEWSLETTERS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  });
}
