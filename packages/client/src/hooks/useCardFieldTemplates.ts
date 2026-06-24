import type { CreateCardFieldTemplateInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cardFieldTemplatesApi } from "../lib/api/settings";
import { notifySuccess } from "../lib/notifications";

const TEMPLATES_KEY = ["card-field-templates"] as const;

export function useCardFieldTemplates() {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: cardFieldTemplatesApi.list,
  });
}

export function useCreateCardFieldTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardFieldTemplateInput) => cardFieldTemplatesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TEMPLATES_KEY,
      });
      notifySuccess("Template saved");
    },
  });
}

export function useDeleteCardFieldTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardFieldTemplatesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: TEMPLATES_KEY,
      });
      notifySuccess("Template deleted");
    },
  });
}
