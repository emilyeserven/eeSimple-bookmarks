import type { UpdateAdvancedSettingsInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";

const ADVANCED_KEY = ["app-settings", "advanced"] as const;

/** Advanced settings: the opt-in Coolify / docs / Storybook sidebar links (persisted server-side). */
export function useAdvancedSettings() {
  return useQuery({
    queryKey: ADVANCED_KEY,
    queryFn: appSettingsApi.getAdvanced,
  });
}

export function useUpdateAdvancedSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdvancedSettingsInput) => appSettingsApi.updateAdvanced(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(ADVANCED_KEY, saved);
    },
  });
}
