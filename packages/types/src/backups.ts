/**
 * Scheduled database backups (Settings → Advanced → Backups). On a cron schedule the middleware runs
 * `pg_dump --format=custom`, uploads the dump to an S3-compatible bucket on another machine (for
 * example a Garage or MinIO instance on a Tailscale address), optionally mirrors the image bucket
 * beside it, then prunes old dumps down to the retention count. Configuration rides the
 * `app_settings` singleton; the destination secret key is stored encrypted and never returned.
 */

/** How a backup run was started. */
export const BACKUP_TRIGGERS = ["schedule", "manual"] as const;

export type BackupTrigger = typeof BACKUP_TRIGGERS[number];

/** Lifecycle of a single backup run. */
export const BACKUP_RUN_STATUSES = ["running", "succeeded", "failed"] as const;

export type BackupRunStatus = typeof BACKUP_RUN_STATUSES[number];

/** Default cron expression: every day at 03:00 in the configured time zone. */
export const DEFAULT_BACKUP_SCHEDULE = "0 3 * * *";

/** Default number of database dumps kept at the destination. */
export const DEFAULT_BACKUP_RETENTION = 14;

/** Upper bound on the retention count (a guard against a typo keeping thousands of dumps). */
export const MAX_BACKUP_RETENTION = 365;

/** Backup configuration from `GET /api/app-settings/backups`. Never carries the raw secret key. */
export interface BackupSettings {
  /** Whether the cron schedule is active. "Back up now" works either way once a destination is set. */
  enabled: boolean;
  /** Five-field cron expression (minute hour day-of-month month day-of-week). */
  schedule: string;
  /** IANA time zone the schedule is evaluated in, e.g. `Asia/Tokyo`. */
  timezone: string;
  /** How many database dumps to keep at the destination; older ones are deleted after each run. */
  retention: number;
  /** Also copy new objects from the image bucket to the destination. */
  includeImages: boolean;
  /** S3 API endpoint of the destination, e.g. `http://100.101.102.103:3900`. */
  endpoint: string;
  /** S3 region (Garage's default is `garage`). */
  region: string;
  bucket: string;
  /** Key prefix (folder) inside the bucket; dumps go under `<prefix>/db/`, images under `<prefix>/images/`. */
  prefix: string;
  accessKeyId: string;
  /** Whether a secret access key is stored. The value itself is never returned. */
  secretAccessKeySet: boolean;
  /** Whether `APP_SECRET` is set, so the secret key is encrypted at rest. */
  encryptionEnabled: boolean;
}

/**
 * Body for `PUT /api/app-settings/backups`: a partial patch, so each field can auto-save on its own.
 * `secretAccessKey`: omit or `null` keeps the stored key, a blank string clears it.
 */
export type UpdateBackupSettingsInput = Partial<Omit<BackupSettings, "secretAccessKeySet" | "encryptionEnabled">> & {
  secretAccessKey?: string | null;
};

/** The outcome of one backup run, kept for the most recent run. */
export interface BackupRun {
  trigger: BackupTrigger;
  status: BackupRunStatus;
  startedAt: string;
  finishedAt: string | null;
  /** Object key of the uploaded dump, once uploaded. */
  dumpKey: string | null;
  dumpBytes: number | null;
  /** Images copied to the destination this run (only new ones are copied). */
  imagesCopied: number;
  /** Old dumps deleted by the retention prune. */
  prunedCount: number;
  /** Why the run failed, in English (shown verbatim on the settings page). */
  error: string | null;
}

/** Live backup state from `GET /api/backups/status`. */
export interface BackupStatus {
  /** The most recent run, or null before the first one. */
  lastRun: BackupRun | null;
  /** Whether a run is in progress right now. */
  running: boolean;
  /** When the schedule fires next (ISO), or null when the schedule is off or invalid. */
  nextRunAt: string | null;
  /** The `pg_dump --version` output, or null when `pg_dump` isn't installed on the server. */
  pgDumpVersion: string | null;
  /** Whether endpoint, bucket and both keys are all set. */
  destinationConfigured: boolean;
}

/** One database dump stored at the destination. */
export interface BackupFile {
  key: string;
  size: number;
  lastModified: string | null;
}

/** `GET /api/backups/files`: the stored dumps, or why the destination couldn't be listed. */
export interface BackupFileList {
  files: BackupFile[];
  error: string | null;
}

/** Result of `POST /api/backups/test`: whether the destination bucket answered. */
export interface BackupDestinationCheck {
  ok: boolean;
  /** Why the check failed, in English; null when it passed. */
  error: string | null;
}
