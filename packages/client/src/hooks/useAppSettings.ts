import type { UpdateHomepageContentInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../lib/api";

const SHORTENER_IGNORE_LIST_KEY = ["app-settings", "shortener-ignore-list"] as const;
const HOMEPAGE_CONTENT_KEY = ["app-settings", "homepage-content"] as const;

/** The generic URL-shortener ignore list (e.g. bit.ly) used to nudge for un-expandable links. */
export function useShortenerIgnoreList() {
  return useQuery({
    queryKey: SHORTENER_IGNORE_LIST_KEY,
    queryFn: appSettingsApi.getShortenerIgnoreList,
  });
}

export function useUpdateShortenerIgnoreList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => appSettingsApi.updateShortenerIgnoreList(domains),
    onSuccess: (saved) => {
      queryClient.setQueryData(SHORTENER_IGNORE_LIST_KEY, saved);
    },
  });
}

/** Homepage content settings: the homepage text and Bookmark Quick Add configuration. */
export function useHomepageContentSettings() {
  return useQuery({
    queryKey: HOMEPAGE_CONTENT_KEY,
    queryFn: appSettingsApi.getHomepageContent,
  });
}

export function useUpdateHomepageContentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateHomepageContentInput) =>
      appSettingsApi.updateHomepageContent(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(HOMEPAGE_CONTENT_KEY, saved);
    },
  });
}
