import type { CreateWebsiteInput, UpdateWebsiteInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { websitesApi } from "../lib/api";
import { ApiError } from "../lib/apiError";
import { buildGitHubIssueUrl } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";
import { useRateLimitCooldown } from "./useRateLimitCooldown";

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

/** Re-grab a website's favicon from its homepage (icon link / og:image). */
export function useAutoWebsiteFavicon() {
  const queryClient = useQueryClient();
  const cooldown = useRateLimitCooldown(30_000);
  const mutation = useMutation({
    mutationFn: (id: string) => websitesApi.autoImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: WEBSITES_KEY,
      });
      notifySuccess("Favicon fetched");
    },
    onError: (err: Error) => {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === "blocked") cooldown.startCooldown();
      notifyError(err.message || "Could not fetch a favicon", {
        action: {
          label: "File issue",
          onClick: () =>
            window.open(
              buildGitHubIssueUrl({
                operation: "website favicon",
                errorMessage: err.message,
                errorCode: code,
              }),
              "_blank",
              "noopener,noreferrer",
            ),
        },
      });
    },
  });
  return { ...mutation, cooldown };
}
