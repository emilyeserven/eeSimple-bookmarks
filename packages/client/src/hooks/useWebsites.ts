import type { CreateWebsiteInput, UpdateWebsiteInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRateLimitCooldown } from "./useRateLimitCooldown";
import { websitesApi } from "../lib/api";
import { ApiError, describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

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

/** Upload a user-chosen favicon for a website, replacing any existing one. */
export function useUploadWebsiteFavicon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) => websitesApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      notifySuccess("Favicon updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the favicon")),
  });
}

/** Remove a website's stored favicon. */
export function useDeleteWebsiteFavicon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => websitesApi.deleteImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      notifySuccess("Favicon removed");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the favicon")),
  });
}

/** Re-grab a website's favicon from its homepage (icon link / og:image). */
export function useAutoWebsiteFavicon() {
  const queryClient = useQueryClient();
  const cooldown = useRateLimitCooldown(30_000);
  const mutation = useMutation({
    mutationFn: ({
      id,
    }: { id: string;
      sourceUrl: string; }) => websitesApi.autoImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      notifySuccess("Favicon fetched");
    },
    onError: (err: Error, {
      sourceUrl,
    }) => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      if (err instanceof ApiError && err.code === "blocked") cooldown.startCooldown();
      notifyImageFetchError(err, "website favicon", "Could not fetch a favicon", sourceUrl);
    },
  });
  return {
    ...mutation,
    cooldown,
  };
}
