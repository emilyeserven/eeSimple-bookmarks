import type {
  CardDisplayRule,
  CreateCardDisplayRuleInput,
  UpdateCardDisplayRuleInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useCreateCardDisplayRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardDisplayRuleInput) => cardDisplayRulesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifySuccess("Rule created");
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifySuccess("Rule saved");
    },
  });
}

export function useDeleteCardDisplayRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardDisplayRulesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: RULES_KEY,
      });
      notifySuccess("Rule deleted");
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
