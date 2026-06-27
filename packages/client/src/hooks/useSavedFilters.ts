import type {
  CreateSavedFilterInput,
  UpdateSavedFilterInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedFiltersApi } from "../lib/api/settings";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

const SAVED_FILTERS_KEY = ["saved-filters"] as const;

export function useSavedFilters() {
  return useQuery({
    queryKey: SAVED_FILTERS_KEY,
    queryFn: savedFiltersApi.list,
  });
}

export function useSavedFilterBySlug(slug: string) {
  const query = useSavedFilters();
  return {
    ...query,
    savedFilter: (query.data ?? []).find(f => f.slug === slug),
  };
}

export function useCreateSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSavedFilterInput) => savedFiltersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SAVED_FILTERS_KEY,
      });
      notifySuccess("Filter saved");
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to save filter"));
    },
  });
}

export function useUpdateSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateSavedFilterInput; }) => savedFiltersApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SAVED_FILTERS_KEY,
      });
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to update filter"));
    },
  });
}

export function useDeleteSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedFiltersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SAVED_FILTERS_KEY,
      });
      notifySuccess("Filter deleted");
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to delete filter"));
    },
  });
}
