import i18n from "../../i18n";

/** A ready-made cron schedule offered in the Backups schedule picker. */
export interface BackupSchedulePreset {
  cron: string;
  label: string;
}

/** The schedule presets; anything else shows as "Custom". */
export function backupSchedulePresets(): BackupSchedulePreset[] {
  return [
    {
      cron: "0 3 * * *",
      label: i18n.t("Every day at 3:00"),
    },
    {
      cron: "0 */12 * * *",
      label: i18n.t("Every 12 hours"),
    },
    {
      cron: "0 */6 * * *",
      label: i18n.t("Every 6 hours"),
    },
    {
      cron: "0 3 * * 0",
      label: i18n.t("Every Sunday at 3:00"),
    },
  ];
}

/** Value of the "Custom" option in the preset select. */
export const CUSTOM_SCHEDULE = "custom";

/** The preset select's value for a stored cron expression. */
export function presetValueFor(cron: string): string {
  return backupSchedulePresets().some(p => p.cron === cron) ? cron : CUSTOM_SCHEDULE;
}

/** The browser's IANA time zone, offered as a one-click fill for the schedule's time zone. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
  catch {
    return "UTC";
  }
}
