import type { ToastedMutationVars } from "./shared";
import type { ImportBlacklistEntry } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";
import { notifyFieldSaved, notifyFieldSaveError } from "../../lib/autoSave";
import { notifyError, notifySuccess } from "../../lib/notifications";

const SHORTENER_IGNORE_LIST_KEY = ["app-settings", "shortener-ignore-list"] as const;
const CUSTOM_STRIP_PARAMS_KEY = ["app-settings", "custom-strip-params"] as const;
const REDIRECT_IGNORE_LIST_KEY = ["app-settings", "redirect-ignore-list"] as const;
const IMPORT_BLACKLIST_KEY = ["app-settings", "import-blacklist"] as const;

/** The generic URL-shortener ignore list (e.g. bit.ly) used to nudge for un-expandable links. */
export function useShortenerIgnoreList() {
  return useQuery({
    queryKey: SHORTENER_IGNORE_LIST_KEY,
    queryFn: appSettingsApi.getShortenerIgnoreList,
  });
}

export function useUpdateShortenerIgnoreList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => appSettingsApi.updateShortenerIgnoreList(domains),
    onSuccess: (saved) => {
      queryClient.setQueryData(SHORTENER_IGNORE_LIST_KEY, saved);
      notifyFieldSaved("Shortener ignore list");
    },
    onError: () => notifyFieldSaveError("Shortener ignore list"),
  });
}

/** User-defined query params to strip in addition to the built-in TRACKING_PARAMS. */
export function useCustomStripParams() {
  return useQuery({
    queryKey: CUSTOM_STRIP_PARAMS_KEY,
    queryFn: appSettingsApi.getCustomStripParams,
  });
}

export function useUpdateCustomStripParams() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: string[]) => appSettingsApi.updateCustomStripParams(params),
    onSuccess: (saved) => {
      queryClient.setQueryData(CUSTOM_STRIP_PARAMS_KEY, saved);
      notifyFieldSaved("Custom strip parameters");
    },
    onError: () => notifyFieldSaveError("Custom strip parameters"),
  });
}

/** Domains whose redirect chains should never be followed when scanning a bookmark URL. */
export function useRedirectIgnoreList() {
  return useQuery({
    queryKey: REDIRECT_IGNORE_LIST_KEY,
    queryFn: appSettingsApi.getRedirectIgnoreList,
  });
}

export function useUpdateRedirectIgnoreList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (domains: string[]) => appSettingsApi.updateRedirectIgnoreList(domains),
    onSuccess: (saved) => {
      queryClient.setQueryData(REDIRECT_IGNORE_LIST_KEY, saved);
      notifyFieldSaved("Redirect ignore list");
    },
    onError: () => notifyFieldSaveError("Redirect ignore list"),
  });
}

/** The imports blacklist — links matching these are dropped from future imports. */
export function useImportBlacklist() {
  return useQuery({
    queryKey: IMPORT_BLACKLIST_KEY,
    queryFn: appSettingsApi.getImportBlacklist,
  });
}

export function useUpdateImportBlacklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<ImportBlacklistEntry[]>) =>
      appSettingsApi.updateImportBlacklist(vars.input),
    onSuccess: (saved, vars) => {
      queryClient.setQueryData(IMPORT_BLACKLIST_KEY, saved);
      notifySuccess(vars.successMessage);
    },
    onError: (error, vars) => notifyError(vars.errorMessage ?? error.message),
  });
}
