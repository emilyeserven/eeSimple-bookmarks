/**
 * SFTP backup destination: a folder on any computer with SSH turned on (macOS "Remote Login", the
 * OpenSSH server on Linux or Windows), reached over the tailnet with
 * [ssh2](https://github.com/mscdex/ssh2). Signs in with a password or the app's own generated key.
 *
 * The host's key fingerprint is remembered after the first successful connection
 * ("trust on first use", like `ssh` asking "are you sure you want to continue connecting?") and
 * every later connection must present the same one.
 */

import { createHash } from "node:crypto";
import type { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
// ssh2 is CommonJS without static named exports, so import the default and destructure.
import ssh2, { type Client, type FileEntryWithStats, type SFTPWrapper } from "ssh2";
import type { SftpDestination } from "@/services/backupConfig";
import { type BackupObjectInfo, type BackupTarget, joinPath } from "./backupTarget";

/** SSH connect timeout. Generous so a sleeping laptop's Wi-Fi has time to wake. */
const READY_TIMEOUT_MS = 20_000;

/** The `ssh-keygen -l` style fingerprint of a raw host key: `SHA256:<base64, no padding>`. */
export function hostKeyFingerprint(key: Buffer): string {
  return `SHA256:${createHash("sha256").update(key).digest("base64").replace(/=+$/, "")}`;
}

function connect(dest: SftpDestination): Promise<{ client: Client;
  sftp: SFTPWrapper;
  fingerprint: string; }> {
  return new Promise((resolve, reject) => {
    const client = new ssh2.Client();
    let fingerprint = "";
    client.on("ready", () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end();
          reject(err);
          return;
        }
        resolve({
          client,
          sftp,
          fingerprint,
        });
      });
    });
    client.on("error", reject);
    client.connect({
      host: dest.host,
      port: dest.port,
      username: dest.username,
      password: dest.password ?? undefined,
      privateKey: dest.privateKey ?? undefined,
      readyTimeout: READY_TIMEOUT_MS,
      hostVerifier: (key: Buffer) => {
        fingerprint = hostKeyFingerprint(key);
        return !dest.hostFingerprint || dest.hostFingerprint === fingerprint;
      },
    });
  });
}

function call<T>(fn: (cb: (err: Error | null | undefined, value?: T) => void) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, value) => (err ? reject(err) : resolve(value as T)));
  });
}

/** `mkdir -p` over SFTP: create each missing folder along `dir`. */
async function ensureDir(sftp: SFTPWrapper, dir: string, known: Set<string>): Promise<void> {
  if (!dir || known.has(dir)) return;
  const parts = dir.split("/");
  for (let i = 1; i <= parts.length; i++) {
    const current = parts.slice(0, i).join("/");
    if (!current || known.has(current)) continue;
    try {
      await call(cb => sftp.stat(current, cb));
    }
    catch {
      await call(cb => sftp.mkdir(current, cb));
    }
    known.add(current);
  }
}

/** Every file under `dir` (recursively), as paths relative to `root`. A missing folder lists empty. */
async function walk(sftp: SFTPWrapper, root: string, dir: string): Promise<BackupObjectInfo[]> {
  let entries: FileEntryWithStats[];
  try {
    entries = await call<FileEntryWithStats[]>(cb => sftp.readdir(joinPath(root, dir), cb));
  }
  catch (err) {
    if ((err as { code?: number }).code === 2) return []; // SSH_FX_NO_SUCH_FILE
    throw err;
  }
  const out: BackupObjectInfo[] = [];
  for (const entry of entries) {
    if (entry.filename === "." || entry.filename === "..") continue;
    const path = joinPath(dir, entry.filename);
    if (entry.attrs.isDirectory()) {
      out.push(...await walk(sftp, root, path));
    }
    else {
      out.push({
        path,
        size: entry.attrs.size,
        lastModified: entry.attrs.mtime ? new Date(entry.attrs.mtime * 1000) : null,
      });
    }
  }
  return out;
}

export async function createSftpTarget(dest: SftpDestination): Promise<BackupTarget> {
  const {
    client,
    sftp,
    fingerprint,
  } = await connect(dest);
  const root = dest.path;
  const knownDirs = new Set<string>();
  const remotePath = (path: string) => joinPath(root, path);
  return {
    hostFingerprint: fingerprint,
    put: async (path: string, body: Readable) => {
      const full = remotePath(path);
      await ensureDir(sftp, full.slice(0, full.lastIndexOf("/")), knownDirs);
      // Write to a temporary name, then rename, so a dropped connection never leaves a half-written
      // file that looks like a finished backup.
      const partial = `${full}.partial`;
      // Owner-only (0600): a dump holds the whole database.
      await pipeline(body, sftp.createWriteStream(partial, {
        mode: 0o600,
      }));
      await call(cb => sftp.unlink(full, () => cb(null))); // rename fails if the target exists
      await call(cb => sftp.rename(partial, full, cb));
    },
    list: dir => walk(sftp, root, dir),
    remove: path => call(cb => sftp.unlink(remotePath(path), cb)),
    check: async () => {
      // Prove we can write: create the folder and a small file, then delete it.
      const probe = `${remotePath(".eesimple-write-test")}`;
      await ensureDir(sftp, root, knownDirs);
      await call(cb => sftp.writeFile(probe, "ok", cb));
      await call(cb => sftp.unlink(probe, cb));
    },
    locate: path => `${dest.host}:${remotePath(path)}`,
    close: () => client.end(),
  };
}
