import type { CreateItemInput, UpdateItemInput } from "@app/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import i18n from "@/i18n";
import { itemsApi } from "@/lib/api/items";
import { describeError } from "@/lib/apiError";
import { notifyError, notifySuccess } from "@/lib/notifications";

/** Module-level query key — reuse it for every read/invalidation of the items list. */
export const ITEMS_QUERY_KEY = ["items"] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: itemsApi.list,
  });
}

/** Invalidate the items list (plus any dependent queries once they exist). */
function useItemsInvalidation() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({
    queryKey: ITEMS_QUERY_KEY,
  });
}

export function useCreateItem() {
  const invalidate = useItemsInvalidation();
  return useMutation({
    mutationFn: (input: CreateItemInput) => itemsApi.create(input),
    onSuccess: (item) => {
      void invalidate();
      notifySuccess(i18n.t("Created \"{{name}}\"", {
        name: item.name,
      }));
    },
    onError: err => notifyError(describeError(err)),
  });
}

export function useUpdateItem() {
  const invalidate = useItemsInvalidation();
  return useMutation({
    mutationFn: ({
      id, input,
    }: { id: string;
      input: UpdateItemInput; }) => itemsApi.update(id, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteItem() {
  const invalidate = useItemsInvalidation();
  return useMutation({
    mutationFn: (id: string) => itemsApi.remove(id),
    onSuccess: () => {
      void invalidate();
      notifySuccess(i18n.t("Deleted item"));
    },
    onError: err => notifyError(describeError(err)),
  });
}
