import type { Readable } from "node:stream";

/**
 * The interface every backup destination implements (see `backupStore.ts` for S3 and
 * `backupSftp.ts` for SFTP). Paths are relative to the destination root and use `/`.
 */

/** A file stored at the destination. `path` is relative to the destination root. */
export interface BackupObjectInfo {
  path: string;
  size: number;
  lastModified: Date | null;
}

export interface BackupTarget {
  /** Store a stream of known length at `path`, creating folders as needed. */
  put: (path: string, body: Readable, size: number, contentType?: string) => Promise<void>;
  /** Every file under `dir` (recursively). */
  list: (dir: string) => Promise<BackupObjectInfo[]>;
  remove: (path: string) => Promise<void>;
  /** Throws when the destination can't be reached or used. */
  check: () => Promise<void>;
  /** Where `path` lives, for display (a full remote path or object key). */
  locate: (path: string) => string;
  close: () => void;
  /** SFTP only: the fingerprint the host presented (`SHA256:…`), to remember after a first connection. */
  hostFingerprint?: string;
}

/** Join path segments with `/`, dropping empty ones. */
export function joinPath(...parts: string[]): string {
  return parts.filter(Boolean).join("/").replace(/\/{2,}/g, "/");
}
