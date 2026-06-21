import type {
  CreateCustomPropertyInput,
  UpdateCustomPropertyInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { customPropertiesApi } from "../lib/api";
import { notifyError, notifySuccess } from "../lib/notifications";

const PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useCustomProperties() {
  return useQuery({
    queryKey: PROPERTIES_KEY,
    queryFn: customPropertiesApi.list,
  });
}

/** A single custom property looked up by slug from the list, plus the list's load state. */
export function usePropertyBySlug(slug: string) {
  const query = useCustomProperties();
  return {
    ...query,
    property: (query.data ?? []).find(item => item.slug === slug),
  };
}

export function useCreateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomPropertyInput) => customPropertiesApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROPERTIES_KEY,
      });
      notifySuccess("Property created");
    },
    onError: error => notifyError(error.message),
  });
}

export function useUpdateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateCustomPropertyInput; }) => customPropertiesApi.update(id, input),
    // No toast here: the edit tabs auto-save and fire their own per-field/section toast
    // (`notifyFieldSaved`), so a generic "Property saved" would double up. Callers that mutate as a
    // single action (the panel edit form, the category-assignment toggle) pass their own success
    // toast in the per-call options.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROPERTIES_KEY,
      });
      // Operand/unit edits can change how bookmark values are computed or rendered.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
    },
  });
}

export function useDeleteCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customPropertiesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: PROPERTIES_KEY,
      });
      // A deleted property's values disappear from bookmarks too.
      void queryClient.invalidateQueries({
        queryKey: BOOKMARKS_KEY,
      });
      notifySuccess("Property deleted");
    },
    onError: error => notifyError(error.message),
  });
}
