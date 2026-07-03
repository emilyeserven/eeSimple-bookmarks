import type { CreatePersonInput, SocialMediaPlatform, UpdatePersonInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { useRateLimitCooldown } from "./useRateLimitCooldown";
import { peopleApi } from "../lib/api/taxonomies";
import { ApiError, describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

const PERSONS_KEY = ["people"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function usePeople() {
  return useQuery({
    queryKey: PERSONS_KEY,
    queryFn: peopleApi.list,
  });
}

/** Look up a single person by its slug from the cached list. */
export function usePersonBySlug(slug: string) {
  const query = usePeople();
  return {
    ...query,
    person: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Look up a single person by its id from the cached list. */
export function usePersonById(id: string | null | undefined) {
  const query = usePeople();
  return {
    ...query,
    person: id ? (query.data ?? []).find(item => item.id === id) : undefined,
  };
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePersonInput) => peopleApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePersonInput; }) => peopleApi.update(id, input),
    onSuccess: () => {
      // A rename ripples into bookmark reads (each carries its people).
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peopleApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useBulkDeletePeople() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(peopleApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: PERSONS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  });
}

export function useUploadPersonImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) =>
      peopleApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the avatar")),
  });
}

export function useAutoPersonImage() {
  const queryClient = useQueryClient();
  const cooldown = useRateLimitCooldown(60_000);
  const mutation = useMutation({
    mutationFn: ({
      id, source, platform,
    }: { id: string;
      source: "website" | "biography" | "social";
      platform?: SocialMediaPlatform;
      sourceUrl?: string; }) =>
      peopleApi.autoImage(id, source, platform),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      notifySuccess("Avatar fetched");
    },
    onError: (err: Error, {
      sourceUrl,
    }) => {
      if (err instanceof ApiError && err.code === "blocked") cooldown.startCooldown();
      notifyImageFetchError(err, "person avatar", "Could not fetch an avatar", sourceUrl);
    },
  });
  return {
    ...mutation,
    cooldown,
  };
}

export function useDeletePersonImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => peopleApi.deleteImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      notifySuccess("Avatar removed");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the avatar")),
  });
}

export function useAdoptChannelImageForPerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, channelId,
    }: { id: string;
      channelId: string; }) =>
      peopleApi.adoptChannelImage(id, channelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not copy the channel avatar")),
  });
}

export function useAdoptWebsiteFaviconForPerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, websiteId,
    }: { id: string;
      websiteId: string; }) =>
      peopleApi.adoptWebsiteFavicon(id, websiteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PERSONS_KEY,
      });
      notifySuccess("Avatar updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not copy the website favicon")),
  });
}

export function useDetectPersonSocialLinks() {
  return useMutation({
    mutationFn: (id: string) => peopleApi.detectSocialLinks(id),
    onError: (err: Error) => notifyError(describeError(err, "Could not detect social links")),
  });
}
