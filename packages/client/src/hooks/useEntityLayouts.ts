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

// The save/reset mutations are the layout **write** API. Their only consumer is the Page Layouts DnD
// editor (#1160/#1162), which hasn't landed yet — the render path reads through `useEntityLayout` (the
// singular seam in `useEntityLayout.ts`). Keep them wired so the editor sub-issue is a pure UI add; drop
// the suppressions when it imports them.
// fallow-ignore-next-line unused-export
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

// fallow-ignore-next-line unused-export
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
