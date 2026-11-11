import type { ToastedMutationVars } from "./appSettings/shared";
import type { BackupSettings, BackupStatus, UpdateBackupSettingsInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { backupsApi } from "../lib/api/backups";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { notifyError } from "../lib/notifications";

const BACKUP_SETTINGS_KEY = ["app-settings", "backups"] as const;
const BACKUP_STATUS_KEY = ["backups", "status"] as const;
const BACKUP_FILES_KEY = ["backups", "files"] as const;

/** How often (ms) to poll the status while a backup is running. */
const BACKUP_POLL_MS = 2000;

/** Backup configuration (destination, schedule, retention). Never carries the secret key. */
export function useBackupSettings() {
  return useQuery({
    queryKey: BACKUP_SETTINGS_KEY,
    queryFn: backupsApi.getSettings,
  });
}

/** Save a partial patch of the backup settings, with a toast naming the field. */
export function useUpdateBackupSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToastedMutationVars<UpdateBackupSettingsInput>) => backupsApi.updateSettings(vars.input),
    onSuccess: (saved: BackupSettings, vars) => {
      queryClient.setQueryData(BACKUP_SETTINGS_KEY, saved);
      // The next run time and "destination configured" flag both derive from the settings.
      void queryClient.invalidateQueries({
        queryKey: ["backups"],
      });
      notifyFieldSaved(vars.successMessage);
    },
    onError: (error, vars) => notifyFieldSaveError(vars.successMessage, describeError(error, error.message)),
  });
}

/** Live backup status; polls only while a run is in progress. */
export function useBackupStatus() {
  return useQuery({
    queryKey: BACKUP_STATUS_KEY,
    queryFn: backupsApi.status,
    refetchInterval: query => (query.state.data?.running ? BACKUP_POLL_MS : false),
  });
}

/** Start a backup now. The status query takes over (polling) until it finishes. */
export function useRunBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: backupsApi.run,
    onSuccess: (status: BackupStatus) => {
      queryClient.setQueryData(BACKUP_STATUS_KEY, status);
    },
    onError: error => notifyError(describeError(error, "Couldn't start the backup")),
  });
}

/** The dumps stored at the destination, newest first. */
export function useBackupFiles(enabled: boolean) {
  return useQuery({
    queryKey: BACKUP_FILES_KEY,
    queryFn: backupsApi.files,
    enabled,
  });
}

/** Check that the destination bucket answers with the saved credentials. */
export function useTestBackupDestination() {
  return useMutation({
    mutationFn: backupsApi.test,
    onError: error => notifyError(describeError(error, "Couldn't check the destination")),
  });
}
