import type { EntityLayout, EntityLayoutRecord, LayoutableEntityKind } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { entityLayoutsApi } from "../lib/api/settings";

const ENTITY_LAYOUTS_KEY = ["entity-layouts"] as const;

const NO_INVALID_LAYOUTS: EntityLayoutRecord[] = [];

export function useEntityLayouts() {
  return useQuery({
    queryKey: ENTITY_LAYOUTS_KEY,
    queryFn: entityLayoutsApi.list,
  });
}

/**
 * The stored-layout rows the server flagged as structurally invalid (resolved to their default
 * in-memory). Surfaced to the user in Settings → Advanced → Layout Issues and by the app-root
 * {@link useInvalidLayoutsToast} detector. Returns a stable empty array until the shared query loads.
 */
export function useInvalidEntityLayouts(): EntityLayoutRecord[] {
  const {
    data,
  } = useEntityLayouts();
  return data?.filter(record => record.invalid) ?? NO_INVALID_LAYOUTS;
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

/** Clear a corrupted stored layout by its raw kind string (the Layout Issues "Reset to default"). */
export function useClearInvalidLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kind: string) => entityLayoutsApi.clearInvalid(kind),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ENTITY_LAYOUTS_KEY,
      });
    },
  });
}
