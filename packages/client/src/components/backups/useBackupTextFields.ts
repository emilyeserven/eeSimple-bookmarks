import type { BackupSettings, UpdateBackupSettingsInput } from "@eesimple/types";

import { useState } from "react";

import { useUpdateBackupSettings } from "../../hooks/useBackups";

/** The plain-text backup fields that save on blur. */
export type BackupTextField = "sftpHost" | "sftpUsername" | "sftpPath" | "s3Endpoint" | "s3Region" | "s3Bucket" | "s3Prefix" | "s3AccessKeyId";

/** Which secret a password-style field writes. */
export type BackupSecretField = "sftpPassword" | "s3SecretAccessKey";

/**
 * Local edit state for a destination form: text fields that save on blur when changed, and
 * write-only secret fields that save only once typed into (the stored value is never shown).
 */
export function useBackupTextFields(data: BackupSettings, fields: readonly BackupTextField[]) {
  const update = useUpdateBackupSettings();
  const pick = (from: BackupSettings) => Object.fromEntries(fields.map(f => [f, from[f]])) as Record<BackupTextField, string>;
  const [values, setValues] = useState(() => pick(data));
  const [secrets, setSecrets] = useState<Partial<Record<BackupSecretField, string>>>({});

  // Re-seed from the server whenever the saved settings change.
  const [seededFrom, setSeededFrom] = useState(data);
  if (seededFrom !== data) {
    setSeededFrom(data);
    setValues(pick(data));
  }

  function save(input: UpdateBackupSettingsInput, label: string, onSaved?: () => void): void {
    update.mutate({
      input,
      successMessage: label,
    }, {
      onSuccess: onSaved,
    });
  }

  return {
    values,
    setValue: (field: BackupTextField, value: string) => setValues(v => ({
      ...v,
      [field]: value,
    })),
    saveText: (field: BackupTextField, label: string) => {
      if (values[field] === data[field]) return;
      save({
        [field]: values[field],
      }, label);
    },
    secrets,
    setSecret: (field: BackupSecretField, value: string) => setSecrets(s => ({
      ...s,
      [field]: value,
    })),
    saveSecret: (field: BackupSecretField, label: string) => {
      const value = secrets[field];
      if (value === undefined) return;
      save({
        [field]: value,
      }, label, () => setSecrets(s => ({
        ...s,
        [field]: undefined,
      })));
    },
    save,
  };
}
