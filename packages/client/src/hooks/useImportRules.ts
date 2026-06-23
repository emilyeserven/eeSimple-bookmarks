import type {
  CreateImportRuleInput,
  UpdateImportRuleInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { importRulesApi } from "../lib/api/importRules";
import { notifySuccess } from "../lib/notifications";

const IMPORT_RULES_KEY = ["import-rules"] as const;

export function useImportRules() {
  return useQuery({
    queryKey: IMPORT_RULES_KEY,
    queryFn: importRulesApi.list,
  });
}

/** A single import rule looked up by id from the rules list, plus the list's load state. */
export function useImportRuleById(id: string) {
  const query = useImportRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.id === id),
  };
}

/** Look up a single import rule by its slug from the cached list. */
export function useImportRuleBySlug(slug: string) {
  const query = useImportRules();
  return {
    ...query,
    rule: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateImportRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateImportRuleInput) => importRulesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: IMPORT_RULES_KEY,
    }),
  });
}

export function useUpdateImportRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateImportRuleInput; }) => importRulesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: IMPORT_RULES_KEY,
    }),
  });
}

export function useDeleteImportRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => importRulesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: IMPORT_RULES_KEY,
      });
      notifySuccess("Import rule deleted");
    },
  });
}
