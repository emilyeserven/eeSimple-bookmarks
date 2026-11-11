/**
 * Backup configuration (Settings → Advanced → Backups): the non-secret fields live in the
 * `app_settings.backup_settings` jsonb blob and are merged over {@link DEFAULT_BACKUP_SETTINGS};
 * each secret (SFTP password, the app's SFTP private key, S3 secret key) is its own column,
 * encrypted at rest when `APP_SECRET` is set (the connector-key pattern) and never returned.
 *
 * The schedule is stored as plain choices (frequency, time, weekday, time zone) and turned into a
 * cron expression here by {@link cronFromSchedule}, so the UI never shows cron syntax.
 */

import { eq } from "drizzle-orm";
// ssh2 is CommonJS without static named exports, so import the default and destructure.
import ssh2 from "ssh2";
import type {
  BackupDestinationType,
  BackupFrequency,
  BackupSettings,
  BackupSftpAuthMethod,
  UpdateBackupSettingsInput,
} from "@eesimple/types";
import {
  BACKUP_DESTINATION_TYPES,
  BACKUP_FREQUENCIES,
  BACKUP_SFTP_AUTH_METHODS,
  DEFAULT_BACKUP_RETENTION,
  MAX_BACKUP_RETENTION,
} from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { encryptionEnabled, maybeDecrypt, maybeEncrypt } from "@/utils/crypto";
import { ValidationError } from "@/utils/errors";
import { ROW_ID } from "./appSettingsShared";

/** The non-secret settings stored in the jsonb blob. */
export type StoredBackupSettings = Omit<BackupSettings, "sftpPasswordSet" | "s3SecretAccessKeySet" | "encryptionEnabled">;

export const DEFAULT_BACKUP_SETTINGS: StoredBackupSettings = {
  enabled: false,
  frequency: "daily",
  time: "03:00",
  weekday: 0,
  timezone: "UTC",
  retention: DEFAULT_BACKUP_RETENTION,
  includeImages: true,
  destinationType: "sftp",
  sftpHost: "",
  sftpPort: 22,
  sftpUsername: "",
  sftpPath: "eesimple-backups",
  sftpAuthMethod: "password",
  sftpPublicKey: "",
  sftpHostFingerprint: "",
  s3Endpoint: "",
  s3Region: "garage",
  s3Bucket: "",
  s3Prefix: "eesimple-bookmarks",
  s3AccessKeyId: "",
};

/** Whether `value` is a 24-hour `HH:MM` time. */
export function isValidTime(value: string): boolean {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59);
}

/** Whether `tz` is an IANA time zone this runtime knows (e.g. `America/New_York`, `UTC`). */
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

/** The hours of the day an every-`step`-hours schedule runs at, anchored on `hour`: e.g. step 6 from 03 → 3,9,15,21. */
function everyHours(hour: number, step: number): string {
  const hours: number[] = [];
  for (let h = hour % step; h < 24; h += step) hours.push(h);
  return hours.join(",");
}

/**
 * The cron expression for a schedule. Every-N-hours runs are anchored on the chosen time, e.g.
 * every 6 hours at 03:00 → 03:00, 09:00, 15:00 and 21:00.
 */
export function cronFromSchedule(frequency: BackupFrequency, time: string, weekday: number): string {
  const [hour, minute] = (isValidTime(time) ? time : DEFAULT_BACKUP_SETTINGS.time).split(":").map(Number);
  switch (frequency) {
    case "weekly":
      return `${minute} ${hour} * * ${weekday}`;
    case "every12h":
      return `${minute} ${everyHours(hour, 12)} * * *`;
    case "every6h":
      return `${minute} ${everyHours(hour, 6)} * * *`;
    default:
      return `${minute} ${hour} * * *`;
  }
}

/** Clamp a retention count to 1..{@link MAX_BACKUP_RETENTION}; junk falls back to the default. */
export function normalizeRetention(value: unknown): number {
  if (value === null || value === undefined || value === "") return DEFAULT_BACKUP_RETENTION;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_BACKUP_RETENTION;
  return Math.min(MAX_BACKUP_RETENTION, Math.max(1, Math.round(n)));
}

/** Trim a path or prefix and strip trailing slashes (and, for S3 prefixes, leading ones too). */
export function normalizePrefix(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

/** Trim a folder path and strip trailing slashes, keeping a leading `/` (an absolute path). */
export function normalizeSftpPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function asWeekday(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : DEFAULT_BACKUP_SETTINGS.weekday;
}

function asPort(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 65535 ? n : DEFAULT_BACKUP_SETTINGS.sftpPort;
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
    frequency: oneOf<BackupFrequency>(merged.frequency, BACKUP_FREQUENCIES, DEFAULT_BACKUP_SETTINGS.frequency),
    time: typeof merged.time === "string" && isValidTime(merged.time) ? merged.time : DEFAULT_BACKUP_SETTINGS.time,
    weekday: asWeekday(merged.weekday),
    timezone: typeof merged.timezone === "string" && isValidTimezone(merged.timezone) ? merged.timezone : "UTC",
    destinationType: oneOf<BackupDestinationType>(merged.destinationType, BACKUP_DESTINATION_TYPES, DEFAULT_BACKUP_SETTINGS.destinationType),
    sftpAuthMethod: oneOf<BackupSftpAuthMethod>(merged.sftpAuthMethod, BACKUP_SFTP_AUTH_METHODS, DEFAULT_BACKUP_SETTINGS.sftpAuthMethod),
    sftpPort: asPort(merged.sftpPort),
  };
}

/** The schedule fields of a patch, validated. */
function applySchedulePatch(next: StoredBackupSettings, input: UpdateBackupSettingsInput): void {
  if (input.frequency !== undefined) next.frequency = input.frequency;
  if (input.weekday !== undefined) next.weekday = asWeekday(input.weekday);
  if (input.time !== undefined) {
    if (!isValidTime(input.time)) throw new ValidationError(`"${input.time}" is not a valid time (use HH:MM)`);
    next.time = input.time.trim().padStart(5, "0");
  }
  if (input.timezone !== undefined) {
    if (!isValidTimezone(input.timezone)) throw new ValidationError(`"${input.timezone}" is not a known time zone`);
    next.timezone = input.timezone.trim();
  }
}

/** The SFTP fields of a patch. A different host or port forgets the remembered host fingerprint. */
function applySftpPatch(next: StoredBackupSettings, input: UpdateBackupSettingsInput): void {
  const host = input.sftpHost?.trim();
  const port = input.sftpPort !== undefined ? asPort(input.sftpPort) : undefined;
  const moved = (host !== undefined && host !== next.sftpHost) || (port !== undefined && port !== next.sftpPort);
  if (moved || input.forgetSftpHost === true) {
    next.sftpHostFingerprint = "";
  }
  if (host !== undefined) next.sftpHost = host;
  if (port !== undefined) next.sftpPort = port;
  if (input.sftpUsername !== undefined) next.sftpUsername = input.sftpUsername.trim();
  if (input.sftpPath !== undefined) next.sftpPath = normalizeSftpPath(input.sftpPath);
  if (input.sftpAuthMethod !== undefined) next.sftpAuthMethod = input.sftpAuthMethod;
}

/** Apply an update patch to the current settings, validating the time and time zone. */
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
  if (input.destinationType !== undefined) next.destinationType = input.destinationType;
  applySchedulePatch(next, input);
  applySftpPatch(next, input);
  if (input.s3Endpoint !== undefined) next.s3Endpoint = input.s3Endpoint.trim().replace(/\/+$/, "");
  if (input.s3Region !== undefined) next.s3Region = input.s3Region.trim() || DEFAULT_BACKUP_SETTINGS.s3Region;
  if (input.s3Bucket !== undefined) next.s3Bucket = input.s3Bucket.trim();
  if (input.s3Prefix !== undefined) next.s3Prefix = normalizePrefix(input.s3Prefix);
  if (input.s3AccessKeyId !== undefined) next.s3AccessKeyId = input.s3AccessKeyId.trim();
  return next;
}

async function selectBackupRow() {
  const [row] = await db
    .select({
      backupSettings: appSettings.backupSettings,
      backupSftpPassword: appSettings.backupSftpPassword,
      backupSftpPrivateKey: appSettings.backupSftpPrivateKey,
      backupS3SecretAccessKey: appSettings.backupS3SecretAccessKey,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row;
}

async function upsertBackupColumns(set: Partial<typeof appSettings.$inferInsert>): Promise<void> {
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
}

/** Read the backup settings, merged over the defaults. */
export async function getBackupSettings(): Promise<BackupSettings> {
  const row = await selectBackupRow();
  return {
    ...resolveStoredBackupSettings(row?.backupSettings),
    sftpPasswordSet: Boolean(row?.backupSftpPassword),
    s3SecretAccessKeySet: Boolean(row?.backupS3SecretAccessKey),
    encryptionEnabled: encryptionEnabled(),
  };
}

/** Encrypt a secret input: `null`/`undefined` = leave unchanged, blank = clear. */
function secretColumn(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed ? maybeEncrypt(trimmed) : null;
}

/** Patch the backup settings; returns the saved result. */
export async function updateBackupSettings(input: UpdateBackupSettingsInput): Promise<BackupSettings> {
  const row = await selectBackupRow();
  const next = applyBackupSettingsPatch(resolveStoredBackupSettings(row?.backupSettings), input);
  const set: Partial<typeof appSettings.$inferInsert> = {
    backupSettings: next,
  };
  const password = secretColumn(input.sftpPassword);
  if (password !== undefined) set.backupSftpPassword = password;
  const s3Secret = secretColumn(input.s3SecretAccessKey);
  if (s3Secret !== undefined) set.backupS3SecretAccessKey = s3Secret;
  await upsertBackupColumns(set);
  return getBackupSettings();
}

/**
 * Create (or replace) the app's own SSH key pair for SFTP sign-in and switch SFTP to key auth. The
 * private key is stored encrypted; the public key is returned in settings so the user can add it to
 * the other computer's `~/.ssh/authorized_keys`.
 */
export async function generateSftpKeyPair(): Promise<BackupSettings> {
  const row = await selectBackupRow();
  const current = resolveStoredBackupSettings(row?.backupSettings);
  const pair = ssh2.utils.generateKeyPairSync("ed25519", {
    comment: "eesimple-bookmarks-backup",
  });
  await upsertBackupColumns({
    backupSettings: {
      ...current,
      sftpAuthMethod: "key",
      sftpPublicKey: pair.public.trim(),
    },
    backupSftpPrivateKey: maybeEncrypt(pair.private),
  });
  return getBackupSettings();
}

/** Remember the SFTP host's fingerprint after the first successful connection to it. */
export async function rememberSftpHostFingerprint(fingerprint: string): Promise<void> {
  const row = await selectBackupRow();
  const current = resolveStoredBackupSettings(row?.backupSettings);
  if (current.sftpHostFingerprint) return;
  await upsertBackupColumns({
    backupSettings: {
      ...current,
      sftpHostFingerprint: fingerprint,
    },
  });
}

/** Everything a run needs to reach an SFTP destination, secrets included. */
export interface SftpDestination {
  type: "sftp";
  host: string;
  port: number;
  username: string;
  path: string;
  password: string | null;
  privateKey: string | null;
  /** The remembered host fingerprint; empty before the first connection. */
  hostFingerprint: string;
}

/** Everything a run needs to reach an S3 destination, secret included. */
export interface S3Destination {
  type: "s3";
  endpoint: string;
  region: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export type BackupDestination = SftpDestination | S3Destination;

/** Whether every field the destination needs is filled in. */
export function isDestinationComplete(dest: BackupDestination): boolean {
  if (dest.type === "s3") return Boolean(dest.endpoint && dest.bucket && dest.accessKeyId && dest.secretAccessKey);
  return Boolean(dest.host && dest.username && (dest.password || dest.privateKey));
}

/** The resolved settings plus the decrypted destination, or `destination: null` when incomplete. */
export async function getBackupRuntimeConfig(): Promise<{
  settings: StoredBackupSettings;
  destination: BackupDestination | null;
}> {
  const row = await selectBackupRow();
  const settings = resolveStoredBackupSettings(row?.backupSettings);
  const decrypt = (value: string | null | undefined) => (value ? maybeDecrypt(value) || null : null);
  const destination: BackupDestination = settings.destinationType === "s3"
    ? {
      type: "s3",
      endpoint: settings.s3Endpoint,
      region: settings.s3Region,
      bucket: settings.s3Bucket,
      prefix: settings.s3Prefix,
      accessKeyId: settings.s3AccessKeyId,
      secretAccessKey: decrypt(row?.backupS3SecretAccessKey) ?? "",
    }
    : {
      type: "sftp",
      host: settings.sftpHost,
      port: settings.sftpPort,
      username: settings.sftpUsername,
      path: settings.sftpPath,
      password: settings.sftpAuthMethod === "password" ? decrypt(row?.backupSftpPassword) : null,
      privateKey: settings.sftpAuthMethod === "key" ? decrypt(row?.backupSftpPrivateKey) : null,
      hostFingerprint: settings.sftpHostFingerprint,
    };
  return {
    settings,
    destination: isDestinationComplete(destination) ? destination : null,
  };
}
