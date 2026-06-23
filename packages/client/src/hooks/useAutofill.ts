import type {
  AutofillApplyInput,
  AutofillPreviewInput,
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
      notifySuccess(`Applied to ${result.applied} bookmark${result.applied === 1 ? "" : "s"}`);
    },
    onError: () => notifyError("Failed to apply rule"),
  });
}
