import type { CreateGroupTypeInput, UpdateGroupTypeInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { groupTypesApi } from "../lib/api/taxonomies";

const GROUP_TYPES_KEY = ["group-types"] as const;
const GROUPS_KEY = ["groups"] as const;

/** A group-type rename/delete ripples into groups (each carries its group type). */
function invalidateGroupTypeConsumers(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({
    queryKey: GROUP_TYPES_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: GROUPS_KEY,
  });
}

export function useGroupTypes() {
  return useQuery({
    queryKey: GROUP_TYPES_KEY,
    queryFn: groupTypesApi.list,
  });
}

/** Resolve a single group type by slug from the cached list. */
export function useGroupTypeBySlug(slug: string) {
  const query = useGroupTypes();
  return {
    ...query,
    groupType: (query.data ?? []).find(groupType => groupType.slug === slug),
  };
}

export function useCreateGroupType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupTypeInput) => groupTypesApi.create(input),
    onSuccess: () => invalidateGroupTypeConsumers(queryClient),
  });
}

export function useUpdateGroupType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateGroupTypeInput; }) => groupTypesApi.update(id, input),
    onSuccess: () => invalidateGroupTypeConsumers(queryClient),
  });
}

export function useDeleteGroupType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupTypesApi.remove(id),
    onSuccess: () => invalidateGroupTypeConsumers(queryClient),
  });
}

export function useBulkDeleteGroupTypes() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(
    groupTypesApi.bulkDelete,
    () => invalidateGroupTypeConsumers(queryClient),
  );
}
