import type { CreateParseTemplateInput, UpdateParseTemplateInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { parseTemplatesApi } from "../lib/api/settings";
import { notifySuccess } from "../lib/notifications";

const PARSE_TEMPLATES_KEY = ["parse-templates"] as const;

export function useParseTemplates() {
  return useQuery({
    queryKey: PARSE_TEMPLATES_KEY,
    queryFn: parseTemplatesApi.list,
  });
}

export function useCreateParseTemplate() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (input: CreateParseTemplateInput) => parseTemplatesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARSE_TEMPLATES_KEY,
      });
      notifySuccess(t("Parse template saved"));
    },
  });
}

export function useUpdateParseTemplate() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateParseTemplateInput; }) => parseTemplatesApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARSE_TEMPLATES_KEY,
      });
      notifySuccess(t("Parse template updated"));
    },
  });
}

export function useDeleteParseTemplate() {
  const queryClient = useQueryClient();
  const {
    t,
  } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => parseTemplatesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PARSE_TEMPLATES_KEY,
      });
      notifySuccess(t("Parse template deleted"));
    },
  });
}
