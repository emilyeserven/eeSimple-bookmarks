/**
 * The in-process backup schedule. Croner (https://github.com/Hexagon/croner) fires `runBackup` on
 * the configured cron expression and time zone; `protect` skips a tick while the previous run is
 * still going. Started after `app.listen()` and rebuilt whenever the backup settings are saved.
 */

import { Cron } from "croner";
import type { BackupDestinationCheck, BackupStatus } from "@eesimple/types";
import { checkBackupBucket, createBackupStore, describeBackupStoreError } from "@/utils/backupStore";
import { getBackupRuntimeConfig, isValidBackupSchedule, isValidTimezone } from "./backupConfig";
import { getCurrentBackupRun, getLastBackupRun, getPgDumpVersion, runBackup } from "./backupRun";

/** Minimal logger shape, so this module doesn't depend on Fastify. */
interface BackupLogger {
  info: (obj: object, msg: string) => void;
  warn: (obj: object, msg: string) => void;
}

let job: Cron | null = null;
let logger: BackupLogger | null = null;

/** Stop any current schedule and start a new one from the saved settings. */
export async function rescheduleBackups(): Promise<void> {
  job?.stop();
  job = null;
  const {
    settings,
    destination,
  } = await getBackupRuntimeConfig();
  if (!settings.enabled || !destination) return;
  if (!isValidBackupSchedule(settings.schedule) || !isValidTimezone(settings.timezone)) return;
  job = new Cron(settings.schedule, {
    timezone: settings.timezone,
    protect: true,
    name: "database-backup",
  }, async () => {
    try {
      const run = await runBackup("schedule");
      if (run.status === "failed") logger?.warn({
        error: run.error,
      }, "Scheduled backup failed");
      else logger?.info({
        dumpKey: run.dumpKey,
        dumpBytes: run.dumpBytes,
      }, "Scheduled backup finished");
    }
    catch (err) {
      logger?.warn({
        err,
      }, "Scheduled backup skipped");
    }
  });
}

/** Boot step: start the schedule. Call after `app.listen()`. */
export async function startBackupScheduler(log: BackupLogger): Promise<void> {
  logger = log;
  await rescheduleBackups();
}

/** When the schedule fires next (ISO), or null when there is no active schedule. */
function nextBackupRunAt(): string | null {
  return job?.nextRun()?.toISOString() ?? null;
}

/** Live status for the settings page. */
export async function getBackupStatus(): Promise<BackupStatus> {
  const current = getCurrentBackupRun();
  const {
    destination,
  } = await getBackupRuntimeConfig();
  return {
    lastRun: current ?? await getLastBackupRun(),
    running: current !== null,
    nextRunAt: nextBackupRunAt(),
    pgDumpVersion: await getPgDumpVersion(),
    destinationConfigured: destination !== null,
  };
}

/** Check that the saved destination bucket answers with the saved credentials. */
export async function checkBackupDestination(): Promise<BackupDestinationCheck> {
  const {
    destination,
  } = await getBackupRuntimeConfig();
  if (!destination) return {
    ok: false,
    error: "Fill in the endpoint, bucket, access key and secret key first.",
  };
  try {
    await checkBackupBucket(createBackupStore(destination));
    return {
      ok: true,
      error: null,
    };
  }
  catch (err) {
    return {
      ok: false,
      error: describeBackupStoreError(err),
    };
  }
}
