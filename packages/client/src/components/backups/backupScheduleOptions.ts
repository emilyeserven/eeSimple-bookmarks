import type { BackupFrequency } from "@eesimple/types";

import i18n from "../../i18n";

/** The "How often" choices, in menu order. */
export function backupFrequencyOptions(): { value: BackupFrequency;
  label: string; }[] {
  return [
    {
      value: "daily",
      label: i18n.t("Every day"),
    },
    {
      value: "weekly",
      label: i18n.t("Every week"),
    },
    {
      value: "every12h",
      label: i18n.t("Every 12 hours"),
    },
    {
      value: "every6h",
      label: i18n.t("Every 6 hours"),
    },
  ];
}

/** Weekday names for weekly backups, Sunday = 0, in the interface language. */
export function weekdayOptions(locale: string): { value: number;
  label: string; }[] {
  // 2026-11-15 is a Sunday; step forward a day at a time.
  return Array.from({
    length: 7,
  }, (_, i) => ({
    value: i,
    label: new Date(Date.UTC(2026, 10, 15 + i, 12)).toLocaleDateString(locale, {
      weekday: "long",
      timeZone: "UTC",
    }),
  }));
}

/** The browser's IANA time zone; schedule saves send it so times mean what the user expects. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
  catch {
    return "UTC";
  }
}
