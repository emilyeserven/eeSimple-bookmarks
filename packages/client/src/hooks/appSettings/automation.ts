import type { ToastedMutationVars } from "./shared";
import type { AutomationSettings, SidebarOpenModifier, UpdateAutomationInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyError, notifySuccess } from "../../lib/notifications";

const AUTOMATION_KEY = ["app-settings", "automation"] as const;

const AUTOMATION_DEFAULTS = {
  autoFetchTitle: true,
  autoFetchImage: true,
  autoApplyTitleTags: false,
  autoApplyTitleLocations: false,
  shareBypassInbox: false,
  sidebarOpenModifier: "alt" as SidebarOpenModifier,
  defaultCategoryId: null as string | null,
};

/** Automation settings (group B): auto-fetch title/image + the open-in-drawer modifier. */
export function useAutomationSettings() {
  return useQuery({
    queryKey: AUTOMATION_KEY,
    queryFn: appSettingsApi.getAutomation,
  });
}

export function useUpdateAutomationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateAutomationInput>) =>
      appSettingsApi.updateAutomation(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(AUTOMATION_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}

/** Shared by every automation-settings checkbox: current settings + a save(patch, message) that persists one field with a named toast. */
export function useAutomationSettingsForm() {
  const {
    data,
  } = useAutomationSettings();
  const update = useUpdateAutomationSettings();
  const settings = data ?? AUTOMATION_DEFAULTS;

  function save(patch: Partial<AutomationSettings>, message: string): void {
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

/** Whether blurring the bookmark URL field auto-fetches the page title (default true). */
export function useAutoFetchTitle(): boolean {
  const {
    data,
  } = useAutomationSettings();
  return data?.autoFetchTitle ?? AUTOMATION_DEFAULTS.autoFetchTitle;
}

/** Whether the Add Bookmark form auto-fetches the page image on save (default true). */
export function useAutoFetchImage(): boolean {
  const {
    data,
  } = useAutomationSettings();
  return data?.autoFetchImage ?? AUTOMATION_DEFAULTS.autoFetchImage;
}
