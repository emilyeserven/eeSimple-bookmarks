import type { CreateGroupInput, UpdateGroupInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { groupsApi } from "../lib/api/taxonomies";

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
