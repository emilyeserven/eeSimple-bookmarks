import type { CreateAuthorInput, SocialMediaPlatform, UpdateAuthorInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useRateLimitCooldown } from "./useRateLimitCooldown";
import { authorsApi } from "../lib/api/taxonomies";
import { ApiError, describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

const AUTHORS_KEY = ["authors"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useAuthors() {
  return useQuery({
    queryKey: AUTHORS_KEY,
    queryFn: authorsApi.list,
  });
}

/** Look up a single author by its slug from the cached list. */
export function useAuthorBySlug(slug: string) {
  const query = useAuthors();
  return {
    ...query,
    author: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Look up a single author by its id from the cached list. */
export function useAuthorById(id: string | null | undefined) {
  const query = useAuthors();
  return {
    ...query,
    author: id ? (query.data ?? []).find(item => item.id === id) : undefined,
  };
}

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuthorInput) => authorsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
    },
  });
}

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateAuthorInput; }) => authorsApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its authors).
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authorsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useUploadAuthorImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) =>
      authorsApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the avatar")),
  });
}

export function useAutoAuthorImage() {
  const queryClient = useQueryClient();
  const cooldown = useRateLimitCooldown(60_000);
  const mutation = useMutation({
    mutationFn: ({
      id, source, platform,
    }: { id: string;
      source: "website" | "biography" | "social";
      platform?: SocialMediaPlatform;
      sourceUrl?: string; }) =>
      authorsApi.autoImage(id, source, platform),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      notifySuccess("Avatar fetched");
    },
    onError: (err: Error, {
      sourceUrl,
    }) => {
      if (err instanceof ApiError && err.code === "blocked") cooldown.startCooldown();
      notifyImageFetchError(err, "author avatar", "Could not fetch an avatar", sourceUrl);
    },
  });
  return {
    ...mutation,
    cooldown,
  };
}

export function useDeleteAuthorImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authorsApi.deleteImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      notifySuccess("Avatar removed");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the avatar")),
  });
}

export function useAdoptChannelImageForAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, channelId,
    }: { id: string;
      channelId: string; }) =>
      authorsApi.adoptChannelImage(id, channelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not copy the channel avatar")),
  });
}

export function useAdoptWebsiteFaviconForAuthor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, websiteId,
    }: { id: string;
      websiteId: string; }) =>
      authorsApi.adoptWebsiteFavicon(id, websiteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTHORS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not copy the website favicon")),
  });
}

export function useDetectAuthorSocialLinks() {
  return useMutation({
    mutationFn: (id: string) => authorsApi.detectSocialLinks(id),
    onError: (err: Error) => notifyError(describeError(err, "Could not detect social links")),
  });
}
