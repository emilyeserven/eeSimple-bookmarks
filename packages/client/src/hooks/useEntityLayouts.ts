import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { entityLayoutsApi } from "../lib/api/settings";

const ENTITY_LAYOUTS_KEY = ["entity-layouts"] as const;

export function useEntityLayouts() {
  return useQuery({
    queryKey: ENTITY_LAYOUTS_KEY,
    queryFn: entityLayoutsApi.list,
  });
}

/** A single kind's stored layout record from the cached list — null when no override is stored. */
export function useEntityLayout(kind: LayoutableEntityKind) {
  const query = useEntityLayouts();
  return {
    ...query,
    record: (query.data ?? []).find(item => item.entityKind === kind) ?? null,
  };
}

export function useSaveEntityLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind, layout,
    }: { kind: LayoutableEntityKind;
      layout: EntityLayout; }) =>
      entityLayoutsApi.save(kind, layout),
    // No toast here: the LayoutBoard editor (#1160) owns its own save UX.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ENTITY_LAYOUTS_KEY,
      });
    },
  });
}

export function useResetEntityLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kind: LayoutableEntityKind) => entityLayoutsApi.reset(kind),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ENTITY_LAYOUTS_KEY,
      });
    },
  });
}
