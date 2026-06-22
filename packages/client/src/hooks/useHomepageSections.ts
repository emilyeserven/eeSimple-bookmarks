import type {
  CreateHomepageSectionInput,
  HomepageSection,
  UpdateHomepageSectionInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { homepageSectionsApi } from "../lib/api";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

const SECTIONS_KEY = ["homepage-sections"] as const;
const SECTIONS_WITH_BOOKMARKS_KEY = ["bookmarks", "homepage-sections"] as const;

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: SECTIONS_KEY,
  });
  void queryClient.invalidateQueries({
    queryKey: SECTIONS_WITH_BOOKMARKS_KEY,
  });
}

export function useHomepageSections() {
  return useQuery({
    queryKey: SECTIONS_KEY,
    queryFn: homepageSectionsApi.list,
  });
}

export function useHomepageSectionBookmarks() {
  return useQuery({
    queryKey: SECTIONS_WITH_BOOKMARKS_KEY,
    queryFn: homepageSectionsApi.withBookmarks,
  });
}

export function useCreateHomepageSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHomepageSectionInput) => homepageSectionsApi.create(input),
    onSuccess: () => {
      invalidateAll(queryClient);
      notifySuccess("Section created");
    },
  });
}

export function useUpdateHomepageSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateHomepageSectionInput; }) =>
      homepageSectionsApi.update(id, input),
    onSuccess: () => {
      invalidateAll(queryClient);
      notifySuccess("Section saved");
    },
  });
}

export function useDeleteHomepageSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homepageSectionsApi.remove(id),
    onSuccess: () => {
      invalidateAll(queryClient);
      notifySuccess("Section deleted");
    },
  });
}

export function useReorderHomepageSections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => homepageSectionsApi.reorder(orderedIds),
    onSuccess: () => {
      // Sections list key is already updated optimistically; just sync the bookmarks view.
      void queryClient.invalidateQueries({
        queryKey: SECTIONS_WITH_BOOKMARKS_KEY,
      });
    },
    onError: (err: Error) => {
      // Revert optimistic local order by re-fetching.
      void queryClient.invalidateQueries({
        queryKey: SECTIONS_KEY,
      });
      notifyError(describeError(err, "Reorder failed"));
    },
  });
}

/** Convenience: optimistically apply a new section order in the query cache. */
export function useOptimisticReorder() {
  const queryClient = useQueryClient();
  return (sections: HomepageSection[]) => {
    queryClient.setQueryData<HomepageSection[]>(SECTIONS_KEY, sections);
  };
}
