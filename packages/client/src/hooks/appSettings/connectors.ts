import type { ToastedMutationVars } from "./shared";
import type { ConnectorsAppSettings, UpdateConnectorsSettingsInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyFieldSaved, notifyFieldSaveError } from "../../lib/autoSave";

const CONNECTORS_SETTINGS_KEY = ["app-settings", "connectors"] as const;

/** Hosted-metadata connector settings: endpoint, provider label, and whether an API key is stored. */
export function useConnectorsSettings() {
  return useQuery({
    queryKey: CONNECTORS_SETTINGS_KEY,
    queryFn: appSettingsApi.getConnectorsSettings,
  });
}

export function useUpdateConnectorsSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateConnectorsSettingsInput>) =>
      appSettingsApi.updateConnectorsSettings(vars.input),
    onSuccess: (saved: ConnectorsAppSettings, vars) => {
      queryClient.setQueryData(CONNECTORS_SETTINGS_KEY, saved);
      // Refresh the live status badge on the Connectors page.
      void queryClient.invalidateQueries({
        queryKey: ["connectors"],
      });
      notifyFieldSaved(vars.successMessage);
    },
    onError: (error, vars) => notifyFieldSaveError(vars.successMessage, error.message),
  });
}
