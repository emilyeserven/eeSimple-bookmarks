import type { CreateWebsiteInput, UpdateWebsiteInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { websitesApi } from "../lib/api";

const WEBSITES_KEY = ["websites"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useWebsites() {
  return useQuery({
    queryKey: WEBSITES_KEY,
    queryFn: websitesApi.list,
  });
}

/** Look up a single website by its slug from the cached list. */
export function useWebsiteBySlug(slug: string) {
  const query = useWebsites();
  return {
    ...query,
    website: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Manually add a website to the taxonomy (domain + optional friendly name). */
export function useCreateWebsite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWebsiteInput) => websitesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
    },
  });
}

/** Look up whether a URL's site already exists — used for the add-bookmark banner. */
export function useWebsiteLookup() {
  return useMutation({
    mutationFn: (url: string) => websitesApi.lookup(url),
  });
}

export function useUpdateWebsite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateWebsiteInput; }) => websitesApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its website).
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteWebsite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websitesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}
