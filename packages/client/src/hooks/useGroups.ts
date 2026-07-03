import type { CreateGroupInput, UpdateGroupInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { groupsApi } from "../lib/api/taxonomies";
import { describeError } from "../lib/apiError";
import { notifyImageFetchError } from "../lib/bugReport";
import { notifyError, notifySuccess } from "../lib/notifications";

const GROUPS_KEY = ["groups"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;
const GROUP_TYPES_KEY = ["group-types"] as const;

/** A group's group-type membership surfaces as a count on that group type. */
function invalidateGroupConsumers(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({
    queryKey: GROUPS_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: BOOKMARKS_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: GROUP_TYPES_KEY,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: groupsApi.list,
  });
}

/** Look up a single group by its slug from the cached list. */
export function useGroupBySlug(slug: string) {
  const query = useGroups();
  return {
    ...query,
    group: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupsApi.create(input),
    onSuccess: () => invalidateGroupConsumers(queryClient),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateGroupInput; }) => groupsApi.update(id, input),
    // A rename ripples into bookmark reads (each carries its group).
    onSuccess: () => invalidateGroupConsumers(queryClient),
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: () => invalidateGroupConsumers(queryClient),
  });
}

export function useBulkDeleteGroups() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(
    groupsApi.bulkDelete,
    () => invalidateGroupConsumers(queryClient),
  );
}

export function useUploadGroupImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, file,
    }: { id: string;
      file: File; }) => groupsApi.uploadImage(id, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GROUPS_KEY,
      });
      notifySuccess("Image updated");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not upload the image")),
  });
}

export function useAutoGroupImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, source,
    }: { id: string;
      source: "website" | "plex";
      sourceUrl?: string; }) => groupsApi.autoImage(id, source),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GROUPS_KEY,
      });
      notifySuccess("Image fetched");
    },
    onError: (err: Error, {
      sourceUrl,
    }) => notifyImageFetchError(err, "group image", "Could not fetch an image", sourceUrl),
  });
}

export function useDeleteGroupImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.deleteImage(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GROUPS_KEY,
      });
      notifySuccess("Image removed");
    },
    onError: (err: Error) => notifyError(describeError(err, "Could not remove the image")),
  });
}
