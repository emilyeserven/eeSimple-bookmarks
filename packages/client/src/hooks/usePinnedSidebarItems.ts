import type { CreatePinnedSidebarItemInput, UpdatePinnedSidebarItemInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pinnedSidebarItemsApi } from "../lib/api/settings";

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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PINNED_KEY,
      });
    },
  });
}

export function useUpdatePinnedSidebarItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePinnedSidebarItemInput; }) => pinnedSidebarItemsApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PINNED_KEY,
      });
    },
  });
}

export function useReorderPinnedSidebarItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => pinnedSidebarItemsApi.reorder(orderedIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PINNED_KEY,
      });
    },
  });
}

export function useRemovePinnedSidebarItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pinnedSidebarItemsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PINNED_KEY,
      });
    },
  });
}
