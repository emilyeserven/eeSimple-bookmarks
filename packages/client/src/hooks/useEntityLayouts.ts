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

/** The layout **write** API, consumed by the Page Layouts settings editor (#1162). */
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
