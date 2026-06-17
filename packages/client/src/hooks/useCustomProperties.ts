import type {
  CreateCustomPropertyInput,
  UpdateCustomPropertyInput,
} from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { customPropertiesApi } from "../lib/api";

const PROPERTIES_KEY = ["custom-properties"] as const;
const BOOKMARKS_KEY = ["bookmarks"] as const;

export function useCustomProperties() {
  return useQuery({
    queryKey: PROPERTIES_KEY,
    queryFn: customPropertiesApi.list,
  });
}

export function useCreateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomPropertyInput) => customPropertiesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: PROPERTIES_KEY,
    }),
  });
}

export function useUpdateCustomProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateCustomPropertyInput; }) => customPropertiesApi.update(id, input),
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
      toast.success("Property deleted");
    },
  });
}
