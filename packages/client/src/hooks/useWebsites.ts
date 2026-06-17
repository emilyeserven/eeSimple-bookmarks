import type { UpdateWebsiteInput } from "@eesimple/types";

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
