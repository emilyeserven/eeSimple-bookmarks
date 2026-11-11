/**
 * Backup configuration (Settings → Advanced → Backups): the non-secret fields live in the
 * `app_settings.backup_settings` jsonb blob and are merged over {@link DEFAULT_BACKUP_SETTINGS};
 * the destination's S3 secret key is its own column, encrypted at rest when `APP_SECRET` is set
 * (the connector-key pattern) and never returned by the API.
 */

import { eq } from "drizzle-orm";
import { Cron } from "croner";
import type { BackupSettings, UpdateBackupSettingsInput } from "@eesimple/types";
import { DEFAULT_BACKUP_RETENTION, DEFAULT_BACKUP_SCHEDULE, MAX_BACKUP_RETENTION } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { encryptionEnabled, maybeDecrypt, maybeEncrypt } from "@/utils/crypto";
import { ValidationError } from "@/utils/errors";
import { ROW_ID } from "./appSettingsShared";

/** The non-secret settings stored in the jsonb blob. */
type StoredBackupSettings = Omit<BackupSettings, "secretAccessKeySet" | "encryptionEnabled">;

export const DEFAULT_BACKUP_SETTINGS: StoredBackupSettings = {
  enabled: false,
  schedule: DEFAULT_BACKUP_SCHEDULE,
  timezone: "UTC",
  retention: DEFAULT_BACKUP_RETENTION,
  includeImages: true,
  endpoint: "",
  region: "garage",
  bucket: "",
  prefix: "eesimple-bookmarks",
  accessKeyId: "",
};

/**
 * Whether `expr` is a cron schedule we accept: five fields (minute hour day-of-month month
 * day-of-week) or a nickname such as `@daily`. Croner also takes a sixth, seconds field; that is
 * refused so a pasted `* * * * * *` can't start a dump every second.
 */
export function isValidBackupSchedule(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return false;
  if (!trimmed.startsWith("@") && trimmed.split(/\s+/).length !== 5) return false;
  try {
    new Cron(trimmed, {
      paused: true,
    }).stop();
    return true;
  }
  catch {
    return false;
  }
}

/** Whether `tz` is an IANA time zone this runtime knows (e.g. `Asia/Tokyo`, `UTC`). */
export function isValidTimezone(tz: string): boolean {
  if (!tz.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz.trim(),
    });
    return true;
  }
  catch {
    return false;
  }
}

/** Clamp a retention count to 1..{@link MAX_BACKUP_RETENTION}; junk falls back to the default. */
export function normalizeRetention(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_BACKUP_RETENTION;
  return Math.min(MAX_BACKUP_RETENTION, Math.max(1, Math.round(n)));
}

/** Trim a key prefix and strip leading/trailing slashes, so `/backups/pi/` becomes `backups/pi`. */
export function normalizePrefix(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

/** Merge a stored (possibly partial or stale) blob over the defaults, dropping junk values. */
export function resolveStoredBackupSettings(stored: Partial<StoredBackupSettings> | null | undefined): StoredBackupSettings {
  const merged = {
    ...DEFAULT_BACKUP_SETTINGS,
    ...(stored ?? {}),
  };
  return {
    ...merged,
    enabled: merged.enabled === true,
    includeImages: merged.includeImages !== false,
    retention: normalizeRetention(merged.retention),
    schedule: typeof merged.schedule === "string" && merged.schedule.trim() ? merged.schedule : DEFAULT_BACKUP_SCHEDULE,
    timezone: typeof merged.timezone === "string" && merged.timezone.trim() ? merged.timezone : "UTC",
  };
}

/** Apply an update patch to the current settings, validating the schedule and time zone. */
export function applyBackupSettingsPatch(
  current: StoredBackupSettings,
  input: UpdateBackupSettingsInput,
): StoredBackupSettings {
  const next: StoredBackupSettings = {
    ...current,
  };
  if (input.enabled !== undefined) next.enabled = input.enabled;
  if (input.includeImages !== undefined) next.includeImages = input.includeImages;
  if (input.retention !== undefined) next.retention = normalizeRetention(input.retention);
  if (input.schedule !== undefined) {
    if (!isValidBackupSchedule(input.schedule)) {
      throw new ValidationError(`"${input.schedule}" is not a valid five-field cron schedule`);
    }
    next.schedule = input.schedule.trim();
  }
  if (input.timezone !== undefined) {
    if (!isValidTimezone(input.timezone)) {
      throw new ValidationError(`"${input.timezone}" is not a known time zone`);
    }
    next.timezone = input.timezone.trim();
  }
  if (input.endpoint !== undefined) next.endpoint = input.endpoint.trim().replace(/\/+$/, "");
  if (input.region !== undefined) next.region = input.region.trim() || DEFAULT_BACKUP_SETTINGS.region;
  if (input.bucket !== undefined) next.bucket = input.bucket.trim();
  if (input.prefix !== undefined) next.prefix = normalizePrefix(input.prefix);
  if (input.accessKeyId !== undefined) next.accessKeyId = input.accessKeyId.trim();
  return next;
}

async function selectBackupRow() {
  const [row] = await db
    .select({
      backupSettings: appSettings.backupSettings,
      backupSecretAccessKey: appSettings.backupSecretAccessKey,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row;
}

/** Read the backup settings, merged over the defaults. */
export async function getBackupSettings(): Promise<BackupSettings> {
  const row = await selectBackupRow();
  return {
    ...resolveStoredBackupSettings(row?.backupSettings),
    secretAccessKeySet: Boolean(row?.backupSecretAccessKey),
    encryptionEnabled: encryptionEnabled(),
  };
}

/** Patch the backup settings; returns the saved result. */
export async function updateBackupSettings(input: UpdateBackupSettingsInput): Promise<BackupSettings> {
  const row = await selectBackupRow();
  const next = applyBackupSettingsPatch(resolveStoredBackupSettings(row?.backupSettings), input);
  const set: Partial<typeof appSettings.$inferInsert> = {
    backupSettings: next,
  };
  if (input.secretAccessKey !== undefined && input.secretAccessKey !== null) {
    const trimmed = input.secretAccessKey.trim();
    set.backupSecretAccessKey = trimmed ? maybeEncrypt(trimmed) : null;
  }
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      ...set,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set,
    });
  return getBackupSettings();
}

/** Everything a run needs to reach the destination bucket, secret included. */
export interface BackupDestination {
  endpoint: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/** Whether every field needed to reach the destination is filled in. */
export function isDestinationComplete(dest: Partial<BackupDestination>): boolean {
  return Boolean(dest.endpoint && dest.bucket && dest.accessKeyId && dest.secretAccessKey);
}

/** The resolved settings plus the decrypted destination, or `destination: null` when incomplete. */
export async function getBackupRuntimeConfig(): Promise<{
  settings: StoredBackupSettings;
  destination: BackupDestination | null;
}> {
  const row = await selectBackupRow();
  const settings = resolveStoredBackupSettings(row?.backupSettings);
  const destination: BackupDestination = {
    endpoint: settings.endpoint,
    region: settings.region,
    bucket: settings.bucket,
    prefix: settings.prefix,
    accessKeyId: settings.accessKeyId,
    secretAccessKey: row?.backupSecretAccessKey ? maybeDecrypt(row.backupSecretAccessKey) : "",
  };
  return {
    settings,
    destination: isDestinationComplete(destination) ? destination : null,
  };
}
