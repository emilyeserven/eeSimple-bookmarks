import type {
  CardDisplayRule,
  CreateCardDisplayRuleInput,
  UpdateCardDisplayRuleInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cardDisplayRulesApi } from "../lib/api/settings";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

const RULES_KEY = ["card-display-rules"] as const;

export function useCardDisplayRules() {
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: cardDisplayRulesApi.list,
  });
}

/** A single card display rule looked up by id from the rules list, plus the list's load state. */
export function useCardDisplayRuleById(id: string) {
  const query = useCardDisplayRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.id === id),
  };
}

/** Look up a single card display rule by its slug from the cached list. */
export function useCardDisplayRuleBySlug(slug: string) {
  const query = useCardDisplayRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateCardDisplayRule() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateCardDisplayRuleInput) => cardDisplayRulesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifySuccess(t("Rule created"));
    },
  });
}

export function useUpdateCardDisplayRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateCardDisplayRuleInput; }) =>
      cardDisplayRulesApi.update(id, input),
    // No toast here: the edit-tab auto-save (useFieldAutoSave) fires the field-named toast.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
    },
  });
}

export function useDeleteCardDisplayRule() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => cardDisplayRulesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifySuccess(t("Rule deleted"));
    },
  });
}

export function useReorderCardDisplayRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => cardDisplayRulesApi.reorder(orderedIds),
    onError: (err: Error) => {
      // Revert the optimistic local order by re-fetching.
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifyError(describeError(err, "Reorder failed"));
    },
  });
}

/** Convenience: optimistically apply a new rule order in the query cache. */
export function useOptimisticReorderCardDisplayRules() {
  const queryClient = useQueryClient();
  return (rules: CardDisplayRule[]) => {
    queryClient.setQueryData<CardDisplayRule[]>(RULES_KEY, rules);
  };
}
