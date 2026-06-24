import type { CreatePropertyGroupInput, UpdatePropertyGroupInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { propertyGroupsApi } from "../lib/api/taxonomies";

const PROPERTY_GROUPS_KEY = ["property-groups"] as const;
const CUSTOM_PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function usePropertyGroups() {
  return useQuery({
    queryKey: PROPERTY_GROUPS_KEY,
    queryFn: propertyGroupsApi.list,
  });
}

/** Look up a single property group by its slug from the cached list. */
export function usePropertyGroupBySlug(slug: string) {
  const query = usePropertyGroups();
  return {
    ...query,
    propertyGroup: (query.data ?? []).find(item => item.slug === slug),
  };
}

/** Invalidate every query whose rendering depends on group definitions. */
function useInvalidateGroupConsumers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: PROPERTY_GROUPS_KEY,
    });
    // Group create/rename/delete ripples into property grouping and into the detail/filter views.
    void queryClient.invalidateQueries({
      queryKey: CUSTOM_PROPERTIES_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: BOOKMARKS_KEY,
    });
  };
}

export function useCreatePropertyGroup() {
  const invalidate = useInvalidateGroupConsumers();
  return useMutation({
    mutationFn: (input: CreatePropertyGroupInput) => propertyGroupsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePropertyGroup() {
  const invalidate = useInvalidateGroupConsumers();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePropertyGroupInput; }) => propertyGroupsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeletePropertyGroup() {
  const invalidate = useInvalidateGroupConsumers();
  return useMutation({
    mutationFn: (id: string) => propertyGroupsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useBulkDeletePropertyGroups() {
  return useBulkDeleteEntity(propertyGroupsApi.bulkDelete, useInvalidateGroupConsumers());
}
