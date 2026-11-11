/**
 * Scheduled database backups (Settings → Advanced → Backups). On a schedule the middleware runs
 * `pg_dump --format=custom` and sends the dump to another computer, usually over Tailscale: either
 * into a folder over SFTP (any computer with SSH turned on) or into an S3-compatible bucket (Garage,
 * MinIO). It can also copy the image bucket beside it, then it prunes old dumps down to the retention
 * count. Configuration rides the `app_settings` singleton; passwords and keys are stored encrypted
 * and never returned.
 */

/** How a backup run was started. */
export const BACKUP_TRIGGERS = ["schedule", "manual"] as const;

export type BackupTrigger = typeof BACKUP_TRIGGERS[number];

/** Lifecycle of a single backup run. */
export const BACKUP_RUN_STATUSES = ["running", "succeeded", "failed"] as const;

export type BackupRunStatus = typeof BACKUP_RUN_STATUSES[number];

/** Where dumps are sent. */
export const BACKUP_DESTINATION_TYPES = ["sftp", "s3"] as const;

export type BackupDestinationType = typeof BACKUP_DESTINATION_TYPES[number];

/** How the app signs in to the SFTP computer. */
export const BACKUP_SFTP_AUTH_METHODS = ["password", "key"] as const;

export type BackupSftpAuthMethod = typeof BACKUP_SFTP_AUTH_METHODS[number];

/**
 * How often backups run. The server turns this (plus {@link BackupSettings.time} and
 * {@link BackupSettings.weekday}) into the cron expression it schedules, so nobody has to write one.
 */
export const BACKUP_FREQUENCIES = ["daily", "weekly", "every12h", "every6h"] as const;

export type BackupFrequency = typeof BACKUP_FREQUENCIES[number];

/** Default number of database dumps kept at the destination. */
export const DEFAULT_BACKUP_RETENTION = 14;

/** Upper bound on the retention count (a guard against a typo keeping thousands of dumps). */
export const MAX_BACKUP_RETENTION = 365;

/** Backup configuration from `GET /api/app-settings/backups`. Never carries a password or private key. */
export interface BackupSettings {
  /** Whether the schedule is active. "Back up now" works either way once a destination is set. */
  enabled: boolean;
  frequency: BackupFrequency;
  /** Time of day (`HH:MM`, 24-hour) for daily and weekly backups. */
  time: string;
  /** Day of the week for weekly backups: 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** IANA time zone the time is read in, e.g. `America/New_York`. The page fills in the browser's. */
  timezone: string;
  /** How many database dumps to keep at the destination; older ones are deleted after each run. */
  retention: number;
  /** Also copy new files from the image bucket to the destination. */
  includeImages: boolean;
  destinationType: BackupDestinationType;

  /** SFTP: the other computer's address, e.g. its Tailscale name `my-laptop` or IP `100.x.y.z`. */
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  /** SFTP: the folder to put backups in, absolute or relative to the user's home folder. */
  sftpPath: string;
  sftpAuthMethod: BackupSftpAuthMethod;
  /** SFTP: whether a password is stored. The value itself is never returned. */
  sftpPasswordSet: boolean;
  /** SFTP: the app's own public key (OpenSSH format) to add to the other computer, once generated. */
  sftpPublicKey: string;
  /**
   * SFTP: the other computer's host-key fingerprint (`SHA256:…`), remembered on the first successful
   * connection and checked on every later one, so a different machine can't pose as it. Cleared when
   * the host changes.
   */
  sftpHostFingerprint: string;

  /** S3: API endpoint, e.g. `http://100.101.102.103:3900`. */
  s3Endpoint: string;
  /** S3: region (Garage's default is `garage`). */
  s3Region: string;
  s3Bucket: string;
  /** S3: key prefix (folder) inside the bucket. */
  s3Prefix: string;
  s3AccessKeyId: string;
  /** S3: whether a secret access key is stored. The value itself is never returned. */
  s3SecretAccessKeySet: boolean;

  /** Whether `APP_SECRET` is set, so passwords and keys are encrypted at rest. */
  encryptionEnabled: boolean;
}

/** The read-only fields of {@link BackupSettings} that a PUT can't set directly. */
type BackupSettingsReadOnly
  = "sftpPasswordSet" | "sftpPublicKey" | "sftpHostFingerprint" | "s3SecretAccessKeySet" | "encryptionEnabled";

/**
 * Body for `PUT /api/app-settings/backups`: a partial patch, so each field can auto-save on its own.
 * For the two secrets, omit or `null` keeps the stored value and a blank string clears it.
 * `forgetSftpHost: true` clears the remembered host fingerprint, so the next connection trusts
 * whatever key the computer presents (after it was reinstalled, say).
 */
export type UpdateBackupSettingsInput = Partial<Omit<BackupSettings, BackupSettingsReadOnly>> & {
  sftpPassword?: string | null;
  s3SecretAccessKey?: string | null;
  forgetSftpHost?: boolean;
};

/** The outcome of one backup run, kept for the most recent run. */
export interface BackupRun {
  trigger: BackupTrigger;
  status: BackupRunStatus;
  startedAt: string;
  finishedAt: string | null;
  /** Where the dump was stored (file path or object key), once uploaded. */
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
  /** When the schedule fires next (ISO), or null when the schedule is off. */
  nextRunAt: string | null;
  /** The `pg_dump --version` output, or null when `pg_dump` isn't installed on the server. */
  pgDumpVersion: string | null;
  /** Whether every field the chosen destination needs is filled in. */
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

/** Result of `POST /api/backups/test` and `POST /api/backups/test-file`: whether the destination answered. */
export interface BackupDestinationCheck {
  ok: boolean;
  /** Why the check failed, in English; null when it passed. */
  error: string | null;
  /** Test file only: where `hello.txt` was written (e.g. `my-laptop:eesimple-backups/hello.txt`). */
  location?: string;
  /** Test file only: the timestamp written into the file (ISO). */
  sentAt?: string;
}
