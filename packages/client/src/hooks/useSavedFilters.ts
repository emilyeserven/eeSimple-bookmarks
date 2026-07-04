import type {
  CreateSavedFilterInput,
  UpdateSavedFilterInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
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
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateSavedFilterInput) => savedFiltersApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SAVED_FILTERS_KEY,
      });
      notifySuccess(t("Filter saved"));
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

export function useBulkDeleteSavedFilters() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(savedFiltersApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: SAVED_FILTERS_KEY,
    });
  });
}

export function useDeleteSavedFilter() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => savedFiltersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SAVED_FILTERS_KEY,
      });
      notifySuccess(t("Filter deleted"));
    },
    onError: (err: Error) => {
      notifyError(describeError(err, "Failed to delete filter"));
    },
  });
}
