import type {
  BackupDestinationCheck,
  BackupFileList,
  BackupSettings,
  BackupStatus,
  UpdateBackupSettingsInput,
} from "@eesimple/types";

import { request } from "./client";

/** Scheduled database backups (Settings → Advanced → Backups). */
export const backupsApi = {
  getSettings: () => request<BackupSettings>("/app-settings/backups"),
  updateSettings: (input: UpdateBackupSettingsInput) =>
    request<BackupSettings>("/app-settings/backups", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  status: () => request<BackupStatus>("/backups/status"),
  run: () =>
    request<BackupStatus>("/backups/run", {
      method: "POST",
    }),
  files: () => request<BackupFileList>("/backups/files"),
  test: () =>
    request<BackupDestinationCheck>("/backups/test", {
      method: "POST",
    }),
};
