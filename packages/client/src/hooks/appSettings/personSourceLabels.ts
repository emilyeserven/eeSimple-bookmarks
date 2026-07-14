import type { ToastedMutationVars } from "./shared";
import type { PersonSourceLabelSettings, UpdatePersonSourceLabelInput } from "@eesimple/types";

import { DEFAULT_PERSON_SOURCE_LABEL_SETTINGS } from "@eesimple/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyError, notifySuccess } from "../../lib/notifications";

const PERSON_SOURCE_LABELS_KEY = ["app-settings", "person-source-labels"] as const;

/**
 * The resolved Person source-label settings — which `labeledWebsites` label counts as "website" /
 * "biography" for avatar auto-fetch + social-link detection — falling back to the defaults
 * ("website" / "biography") while loading.
 */
export function usePersonSourceLabelSettings(): PersonSourceLabelSettings {
  const {
    data,
  } = useQuery({
    queryKey: PERSON_SOURCE_LABELS_KEY,
    queryFn: appSettingsApi.getPersonSourceLabels,
  });
  return data ?? DEFAULT_PERSON_SOURCE_LABEL_SETTINGS;
}

export function useUpdatePersonSourceLabelSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdatePersonSourceLabelInput>) =>
      appSettingsApi.updatePersonSourceLabels(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(PERSON_SOURCE_LABELS_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/** Shared by both Person source-label fields: current settings + a save(patch, message) that persists one field with a named toast. */
export function usePersonSourceLabelSettingsForm() {
  const settings = usePersonSourceLabelSettings();
  const update = useUpdatePersonSourceLabelSettings();

  function save(patch: Partial<PersonSourceLabelSettings>, message: string): void {
    update.mutate({
      input: {
        ...settings,
        ...patch,
      },
      successMessage: message,
    });
  }

  return {
    settings,
    save,
  };
}
