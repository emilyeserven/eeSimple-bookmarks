import type { CreatePinnedSectionInput, UpdatePinnedSectionInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { pinnedSectionsApi } from "../lib/api/settings";

const PINNED_SECTIONS_KEY = ["pinned-sections"] as const;
// Deleting a section nulls its pins' section_id (FK ON DELETE SET NULL), so pins must refetch too.
const PINNED_ITEMS_KEY = ["pinned-sidebar-items"] as const;

export function usePinnedSections() {
  return useQuery({
    queryKey: PINNED_SECTIONS_KEY,
    queryFn: pinnedSectionsApi.list,
  });
}

function useInvalidatePinnedSections() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: PINNED_SECTIONS_KEY,
    });
    void queryClient.invalidateQueries({
      queryKey: PINNED_ITEMS_KEY,
    });
  };
}

export function useCreatePinnedSection() {
  const invalidate = useInvalidatePinnedSections();
  return useMutation({
    mutationFn: (input: CreatePinnedSectionInput) => pinnedSectionsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdatePinnedSection() {
  const invalidate = useInvalidatePinnedSections();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdatePinnedSectionInput; }) => pinnedSectionsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useReorderPinnedSections() {
  const invalidate = useInvalidatePinnedSections();
  return useMutation({
    mutationFn: (orderedIds: string[]) => pinnedSectionsApi.reorder(orderedIds),
    onSuccess: invalidate,
  });
}

export function useDeletePinnedSection() {
  const invalidate = useInvalidatePinnedSections();
  return useMutation({
    mutationFn: (id: string) => pinnedSectionsApi.remove(id),
    onSuccess: invalidate,
  });
}
