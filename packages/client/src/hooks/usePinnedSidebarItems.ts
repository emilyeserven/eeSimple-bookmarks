import type { CreatePinnedSidebarItemInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pinnedSidebarItemsApi } from "../lib/api";

const PINNED_KEY = ["pinned-sidebar-items"] as const;

export function usePinnedSidebarItems() {
  return useQuery({
    queryKey: PINNED_KEY,
    queryFn: pinnedSidebarItemsApi.list,
  });
}

export function useAddPinnedSidebarItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePinnedSidebarItemInput) => pinnedSidebarItemsApi.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PINNED_KEY }),
  });
}

export function useRemovePinnedSidebarItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pinnedSidebarItemsApi.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PINNED_KEY }),
  });
}
