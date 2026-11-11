/**
 * The in-process backup schedule. The saved choices (frequency, time, weekday, time zone) become a
 * cron expression (`cronFromSchedule`) that Croner (https://github.com/Hexagon/croner) fires
 * `runBackup` on; `protect` skips a tick while the previous run is still going. Started after
 * `app.listen()` and rebuilt whenever the backup settings are saved.
 */

import { Readable } from "node:stream";
import { Cron } from "croner";
import type { BackupDestinationCheck, BackupStatus } from "@eesimple/types";
import { describeBackupStoreError } from "@/utils/backupStore";
import { cronFromSchedule, getBackupRuntimeConfig } from "./backupConfig";
import { getCurrentBackupRun, getLastBackupRun, getPgDumpVersion, runBackup, withBackupTarget } from "./backupRun";

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
  job = new Cron(cronFromSchedule(settings.frequency, settings.time, settings.weekday), {
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

/** Check that the saved destination answers with the saved credentials (and, for SFTP, is writable). */
export async function checkBackupDestination(): Promise<BackupDestinationCheck> {
  const {
    destination,
  } = await getBackupRuntimeConfig();
  if (!destination) return {
    ok: false,
    error: "Fill in every destination field first.",
  };
  try {
    await withBackupTarget(destination, target => target.check());
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

/** Name of the test file "Send test file" writes to the destination root. */
export const TEST_FILE_NAME = "hello.txt";

/** The test file's contents: `world`, then the time it was sent. */
export function testFileContents(at: Date): string {
  return `world\nSent by eeSimple Bookmarks at ${at.toISOString()}\n`;
}

/**
 * Write `hello.txt` (containing "world" and a timestamp) to the destination root and leave it there,
 * so the user can open the folder on the other computer and see a real file arrive. Overwrites the
 * previous test file.
 */
export async function sendBackupTestFile(): Promise<BackupDestinationCheck> {
  const {
    destination,
  } = await getBackupRuntimeConfig();
  if (!destination) return {
    ok: false,
    error: "Fill in every destination field first.",
  };
  const at = new Date();
  const body = Buffer.from(testFileContents(at), "utf8");
  try {
    const location = await withBackupTarget(destination, async (target) => {
      await target.put(TEST_FILE_NAME, Readable.from([body]), body.length, "text/plain; charset=utf-8");
      return target.locate(TEST_FILE_NAME);
    });
    return {
      ok: true,
      error: null,
      location,
      sentAt: at.toISOString(),
    };
  }
  catch (err) {
    return {
      ok: false,
      error: describeBackupStoreError(err),
    };
  }
}
