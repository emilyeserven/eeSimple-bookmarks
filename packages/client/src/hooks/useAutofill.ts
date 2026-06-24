import type {
  AutofillApplyInput,
  AutofillPreviewInput,
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useBulkDeleteEntity } from "./useBulkDeleteEntity";
import { autofillApi } from "../lib/api/autofill";
import { notifyError, notifySuccess } from "../lib/notifications";

const AUTOFILL_KEY = ["autofill-rules"] as const;

/** Preview which existing bookmarks a condition tree matches, evaluated server-side. */
export function useAutofillPreview() {
  return useMutation({
    mutationFn: (input: AutofillPreviewInput) => autofillApi.preview(input),
  });
}

export function useAutofillRules() {
  return useQuery({
    queryKey: AUTOFILL_KEY,
    queryFn: autofillApi.list,
  });
}

/** A single autofill rule looked up by id from the rules list, plus the list's load state. */
export function useAutofillRuleById(id: string) {
  const query = useAutofillRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.id === id),
  };
}

/** Look up a single autofill rule by its slug from the cached list. */
export function useAutofillRuleBySlug(slug: string) {
  const query = useAutofillRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateAutofillRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAutofillRuleInput) => autofillApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: AUTOFILL_KEY,
    }),
  });
}

export function useUpdateAutofillRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateAutofillRuleInput; }) => autofillApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: AUTOFILL_KEY,
    }),
  });
}

export function useDeleteAutofillRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => autofillApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: AUTOFILL_KEY,
      });
      notifySuccess("Autofill rule deleted");
    },
  });
}

export function useBulkDeleteAutofillRules() {
  const queryClient = useQueryClient();
  return useBulkDeleteEntity(autofillApi.bulkDelete, () => {
    void queryClient.invalidateQueries({
      queryKey: AUTOFILL_KEY,
    });
  });
}

/** Fetch all bookmarks matching a rule's conditions with their backfill gap status. */
export function useAutofillBackfill(ruleId: string) {
  return useQuery({
    queryKey: [...AUTOFILL_KEY, ruleId, "backfill"] as const,
    queryFn: () => autofillApi.getBackfill(ruleId),
    enabled: Boolean(ruleId),
  });
}

/** Apply a rule's prefill values to a selected set of bookmarks. */
export function useApplyAutofillBackfill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId, input,
    }: { ruleId: string;
      input: AutofillApplyInput; }) =>
      autofillApi.applyBackfill(ruleId, input),
    onSuccess: (result, {
      ruleId,
    }) => {
      void queryClient.invalidateQueries({
        queryKey: [...AUTOFILL_KEY, ruleId, "backfill"],
      });
      void queryClient.invalidateQueries({
        queryKey: AUTOFILL_KEY,
      });
      void queryClient.invalidateQueries({
        queryKey: [...AUTOFILL_KEY, "global-backfill"],
      });
      notifySuccess(`Applied to ${result.applied} bookmark${result.applied === 1 ? "" : "s"}`);
    },
    onError: () => notifyError("Failed to apply rule"),
  });
}

const GLOBAL_BACKFILL_KEY = [...AUTOFILL_KEY, "global-backfill"] as const;

/** Fetch the cross-rule backfill overview: all rules with bookmarks that need backfill or are exempt. */
export function useGlobalAutofillBackfill() {
  return useQuery({
    queryKey: GLOBAL_BACKFILL_KEY,
    queryFn: autofillApi.getGlobalBackfill,
  });
}

/** Mark a bookmark as exempt from a specific rule's backfill. */
export function useSetAutofillExempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId, bookmarkId,
    }: { ruleId: string;
      bookmarkId: string; }) =>
      autofillApi.setExempt(ruleId, bookmarkId),
    onSuccess: (_data, {
      ruleId,
    }) => {
      void queryClient.invalidateQueries({
        queryKey: [...AUTOFILL_KEY, ruleId, "backfill"],
      });
      void queryClient.invalidateQueries({
        queryKey: GLOBAL_BACKFILL_KEY,
      });
      notifySuccess("Bookmark exempted from rule");
    },
    onError: () => notifyError("Failed to set exemption"),
  });
}

/** Remove a bookmark's exemption from a specific rule's backfill. */
export function useRemoveAutofillExempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId, bookmarkId,
    }: { ruleId: string;
      bookmarkId: string; }) =>
      autofillApi.removeExempt(ruleId, bookmarkId),
    onSuccess: (_data, {
      ruleId,
    }) => {
      void queryClient.invalidateQueries({
        queryKey: [...AUTOFILL_KEY, ruleId, "backfill"],
      });
      void queryClient.invalidateQueries({
        queryKey: GLOBAL_BACKFILL_KEY,
      });
      notifySuccess("Exemption removed");
    },
    onError: () => notifyError("Failed to remove exemption"),
  });
}
