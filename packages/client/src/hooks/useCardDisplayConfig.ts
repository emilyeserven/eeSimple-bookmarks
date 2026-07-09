import type { CardDisplayConfig } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cardDisplayConfigApi } from "../lib/api/settings";

/** React Query key for the single card-display config. */
export const CARD_DISPLAY_CONFIG_KEY = ["card-display"] as const;

/** Read the single card-display configuration (the former Default rule). */
export function useCardDisplayConfig() {
  return useQuery({
    queryKey: CARD_DISPLAY_CONFIG_KEY,
    queryFn: cardDisplayConfigApi.get,
  });
}

/**
 * Partial-update the single card-display config. Each control on the settings page saves its own
 * field; the field-named success toast is fired by the caller (`useFieldAutoSave` / notify* helpers),
 * so this mutation only refreshes the cache.
 */
export function useUpdateCardDisplayConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<CardDisplayConfig>) => cardDisplayConfigApi.update(patch),
    onSuccess: (config) => {
      queryClient.setQueryData<CardDisplayConfig>(CARD_DISPLAY_CONFIG_KEY, config);
    },
  });
}
