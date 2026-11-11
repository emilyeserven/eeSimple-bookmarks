/**
 * One backup run: `pg_dump --format=custom` to a temp file, upload it to the destination (an SFTP
 * folder or an S3 bucket), optionally mirror new image-bucket objects beside it, then prune old dumps down to the retention
 * count. At most one run at a time; the in-progress run lives in memory and only the finished
 * outcome is persisted (`app_settings.backup_last_run`), so a restart mid-run leaves no stale
 * "running" row behind.
 *
 * Kept light for a Raspberry Pi: pg_dump runs at a lowered CPU priority (`nice`), the custom format
 * is already compressed, the upload streams from disk, and images are copied one at a time.
 */

import { execFile, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import type { BackupFileList, BackupRun, BackupTrigger } from "@eesimple/types";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { describeBackupStoreError, openBackupTarget } from "@/utils/backupStore";
import type { BackupTarget } from "@/utils/backupTarget";
import { AppError, ValidationError } from "@/utils/errors";
import { getObjectStream, isObjectStoreConfigured, listObjects } from "@/utils/objectStore";
import { getBackupRuntimeConfig, rememberSftpHostFingerprint, type BackupDestination } from "./backupConfig";
import { ROW_ID } from "./appSettingsShared";

const execFileAsync = promisify(execFile);

/** Folder (under the destination root) where dumps go. */
export const DUMP_DIR = "db";

/** Folder (under the destination root) where the image-bucket mirror goes. */
export const IMAGE_DIR = "images";

/** The dump's path: timestamped so names sort oldest → newest, e.g. `db/eesimple-bookmarks-2026-11-11T03-00-00Z.dump`. */
export function dumpPathFor(at: Date): string {
  const stamp = at.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/:/g, "-");
  return `${DUMP_DIR}/eesimple-bookmarks-${stamp}.dump`;
}

/** The dump keys to delete so only the newest `retention` remain. Only `.dump` files are touched. */
export function selectDumpsToPrune(keys: string[], retention: number): string[] {
  const dumps = keys.filter(k => k.endsWith(".dump")).sort();
  return dumps.slice(0, Math.max(0, dumps.length - Math.max(1, retention)));
}

/**
 * libpq environment variables for `DATABASE_URL`, so the password reaches `pg_dump` through its
 * environment instead of its command line (where `ps` would show it).
 */
export function pgEnvFromDatabaseUrl(databaseUrl: string): Record<string, string> {
  const url = new URL(databaseUrl);
  const env: Record<string, string> = {
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, "")),
    PGAPPNAME: "eesimple-bookmarks-backup",
  };
  if (url.username) env.PGUSER = decodeURIComponent(url.username);
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;
  return env;
}

let pgDumpVersion: string | null = null;

/** `pg_dump --version` (e.g. `pg_dump (PostgreSQL) 18.1`), or null when it isn't installed. */
export async function getPgDumpVersion(): Promise<string | null> {
  if (pgDumpVersion) return pgDumpVersion;
  try {
    const {
      stdout,
    } = await execFileAsync("pg_dump", ["--version"], {
      timeout: 5000,
    });
    pgDumpVersion = stdout.trim() || null;
  }
  catch {
    pgDumpVersion = null;
  }
  return pgDumpVersion;
}

/** Run pg_dump into `file`. Rejects with the tail of its stderr on failure. */
function runPgDump(file: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return Promise.reject(new Error("DATABASE_URL is not set"));
  const dumpArgs = ["--format=custom", "--no-owner", "--no-privileges", "--file", file];
  // Lower the CPU priority so a dump doesn't make the app sluggish on a small machine.
  const [command, args] = process.platform === "win32"
    ? ["pg_dump", dumpArgs]
    : ["nice", ["-n", "10", "pg_dump", ...dumpArgs]];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        ...pgEnvFromDatabaseUrl(databaseUrl),
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim() || "no output"}`));
    });
  });
}

/** Copy image-bucket objects the destination doesn't have yet. Returns how many were copied. */
async function mirrorImages(target: BackupTarget): Promise<number> {
  const existing = new Set((await target.list(IMAGE_DIR)).map(o => o.path.slice(IMAGE_DIR.length + 1)));
  let copied = 0;
  for (const obj of await listObjects()) {
    if (existing.has(obj.key)) continue;
    const source = await getObjectStream(obj.key);
    if (!source) continue;
    await target.put(`${IMAGE_DIR}/${obj.key}`, source.body, source.contentLength ?? obj.size ?? 0, source.contentType);
    copied++;
  }
  return copied;
}

/**
 * Open the destination, run `fn`, and close it. On the first successful SFTP connection, remember
 * the host's fingerprint so later connections can check it.
 */
export async function withBackupTarget<T>(destination: BackupDestination, fn: (target: BackupTarget) => Promise<T>): Promise<T> {
  const target = await openBackupTarget(destination);
  try {
    const result = await fn(target);
    if (destination.type === "sftp" && !destination.hostFingerprint && target.hostFingerprint) {
      await rememberSftpHostFingerprint(target.hostFingerprint);
    }
    return result;
  }
  finally {
    target.close();
  }
}

async function saveLastRun(run: BackupRun): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      id: ROW_ID,
      backupLastRun: run,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        backupLastRun: run,
      },
    });
}

/** The run in progress, or null. */
let currentRun: BackupRun | null = null;

export function getCurrentBackupRun(): BackupRun | null {
  return currentRun;
}

/** The last finished run as persisted, or null before the first one. */
export async function getLastBackupRun(): Promise<BackupRun | null> {
  const [row] = await db
    .select({
      backupLastRun: appSettings.backupLastRun,
    })
    .from(appSettings)
    .where(eq(appSettings.id, ROW_ID));
  return row?.backupLastRun ?? null;
}

/** The steps of a run, filling in `run` as they go. Throws on the first failure. */
async function performBackup(run: BackupRun, destination: BackupDestination, retention: number, includeImages: boolean): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "eesimple-backup-"));
  try {
    const file = join(dir, "dump");
    // Dump first, so a slow dump doesn't hold an idle SSH connection open.
    await runPgDump(file);
    const {
      size,
    } = await stat(file);
    await withBackupTarget(destination, async (target) => {
      const path = dumpPathFor(new Date(run.startedAt));
      await target.put(path, createReadStream(file), size);
      run.dumpKey = target.locate(path);
      run.dumpBytes = size;
      if (includeImages && isObjectStoreConfigured()) {
        run.imagesCopied = await mirrorImages(target);
      }
      const dumps = await target.list(DUMP_DIR);
      for (const path of selectDumpsToPrune(dumps.map(d => d.path), retention)) {
        await target.remove(path);
        run.prunedCount++;
      }
    });
  }
  finally {
    await rm(dir, {
      recursive: true,
      force: true,
    });
  }
}

/**
 * Check that a run can start: a complete destination and an installed pg_dump. Throws a 400
 * `ValidationError` (or 409 when one is already running) so "Back up now" can report why.
 */
export async function assertBackupCanStart(): Promise<void> {
  if (currentRun) throw new AppError("A backup is already running", "conflict", 409);
  const {
    destination,
  } = await getBackupRuntimeConfig();
  if (!destination) throw new ValidationError("Set the backup destination's endpoint, bucket and keys first");
  if (!(await getPgDumpVersion())) throw new ValidationError("pg_dump is not installed on the server");
}

/**
 * Run one backup now. Resolves with the finished run (failed runs resolve too, with `error` set);
 * rejects only when a run is already in progress. The in-progress run is visible through
 * {@link getCurrentBackupRun} as soon as this is called.
 */
export async function runBackup(trigger: BackupTrigger): Promise<BackupRun> {
  if (currentRun) throw new AppError("A backup is already running", "conflict", 409);
  // Claim the slot synchronously, before the first await, so two quick calls can't both start.
  const run: BackupRun = {
    trigger,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    dumpKey: null,
    dumpBytes: null,
    imagesCopied: 0,
    prunedCount: 0,
    error: null,
  };
  currentRun = run;
  try {
    const {
      settings,
      destination,
    } = await getBackupRuntimeConfig();
    if (!destination) throw new ValidationError("Set the backup destination's endpoint, bucket and keys first");
    await performBackup(run, destination, settings.retention, settings.includeImages);
    run.status = "succeeded";
  }
  catch (err) {
    run.status = "failed";
    run.error = err instanceof Error && (err.message.startsWith("pg_dump") || err instanceof AppError)
      ? err.message
      : describeBackupStoreError(err);
  }
  finally {
    run.finishedAt = new Date().toISOString();
    currentRun = null;
  }
  await saveLastRun(run).catch(() => undefined);
  return run;
}

/** The database dumps stored at the destination, newest first, or the reason they couldn't be listed. */
export async function listBackupFiles(): Promise<BackupFileList> {
  const {
    destination,
  } = await getBackupRuntimeConfig();
  if (!destination) return {
    files: [],
    error: null,
  };
  try {
    return await withBackupTarget(destination, async (target) => {
      const objects = await target.list(DUMP_DIR);
      return {
        files: objects
          .filter(o => o.path.endsWith(".dump"))
          .sort((a, b) => b.path.localeCompare(a.path))
          .map(o => ({
            key: target.locate(o.path),
            size: o.size,
            lastModified: o.lastModified?.toISOString() ?? null,
          })),
        error: null,
      };
    });
  }
  catch (err) {
    return {
      files: [],
      error: describeBackupStoreError(err),
    };
  }
}
