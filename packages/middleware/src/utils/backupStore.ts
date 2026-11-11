/**
 * Backup destinations behind one small interface, so a run doesn't care where files go:
 *
 * - **SFTP** (`backupSftp.ts`): a folder on any computer with SSH turned on.
 * - **S3** (below): a bucket on an S3-compatible server such as Garage or MinIO.
 *
 * Both are operator-configured and are meant to be private/tailnet addresses, so neither goes through
 * the SSRF-guarded `guardedFetch` (SSH and the AWS SDK use Node's own sockets, not `fetch`).
 *
 * Paths given to a target are relative to the destination's root (the SFTP folder or the S3 prefix)
 * and use `/`, e.g. `db/eesimple-bookmarks-2026-11-11T03-00-00Z.dump`.
 */

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { BackupDestination, S3Destination } from "@/services/backupConfig";
import { createSftpTarget } from "./backupSftp";
import { type BackupObjectInfo, type BackupTarget, joinPath } from "./backupTarget";

function createS3Target(dest: S3Destination): BackupTarget {
  const client = new S3Client({
    endpoint: dest.endpoint,
    region: dest.region || "garage",
    // Garage and MinIO need path-style addressing.
    forcePathStyle: true,
    credentials: {
      accessKeyId: dest.accessKeyId,
      secretAccessKey: dest.secretAccessKey,
    },
    // Newer SDKs add a streaming checksum trailer (aws-chunked) to every upload by default; not
    // every self-hosted S3 server accepts that, and a streamed dump can't be pre-hashed cheaply.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const keyFor = (path: string) => joinPath(dest.prefix, path);
  return {
    put: async (path, body, size, contentType = "application/octet-stream") => {
      await client.send(new PutObjectCommand({
        Bucket: dest.bucket,
        Key: keyFor(path),
        Body: body,
        ContentLength: size,
        ContentType: contentType,
      }));
    },
    list: async (dir) => {
      const prefix = `${keyFor(dir)}/`;
      const root = dest.prefix ? `${dest.prefix}/` : "";
      const out: BackupObjectInfo[] = [];
      let token: string | undefined;
      do {
        const res = await client.send(new ListObjectsV2Command({
          Bucket: dest.bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }));
        for (const obj of res.Contents ?? []) {
          if (obj.Key) {
            out.push({
              path: obj.Key.slice(root.length),
              size: obj.Size ?? 0,
              lastModified: obj.LastModified ?? null,
            });
          }
        }
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (token);
      return out;
    },
    remove: async (path) => {
      await client.send(new DeleteObjectCommand({
        Bucket: dest.bucket,
        Key: keyFor(path),
      }));
    },
    check: async () => {
      await client.send(new HeadBucketCommand({
        Bucket: dest.bucket,
      }));
    },
    locate: path => `${dest.bucket}/${keyFor(path)}`,
    close: () => client.destroy(),
  };
}

/** Open the configured destination. SFTP connects here; call `close()` when done. */
export async function openBackupTarget(dest: BackupDestination): Promise<BackupTarget> {
  return dest.type === "s3" ? createS3Target(dest) : createSftpTarget(dest);
}

/**
 * A readable English reason for a destination failure, mapping the common SSH, S3 and network
 * errors to something actionable.
 */
export function describeBackupStoreError(err: unknown): string {
  const e = err as {
    name?: string;
    code?: string | number;
    level?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
    cause?: { code?: string };
  } | null;
  const status = e?.$metadata?.httpStatusCode;
  const code = e?.code ?? e?.cause?.code;
  const message = e?.message ?? "";
  if (code === "ECONNREFUSED") return "Connection refused: is SSH (or the S3 server) turned on at that address and port?";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "Computer not found: check the address (and that Tailscale is running on both machines).";
  if (code === "ETIMEDOUT" || code === "EHOSTUNREACH" || /Timed out while waiting for handshake/.test(message)) {
    return "Timed out reaching the other computer: check that it's awake and on the tailnet.";
  }
  if (e?.level === "client-authentication") return "Sign-in failed: check the username and password, or that the app's public key was added to the other computer.";
  if (/Host denied/.test(message)) return "The other computer's identity (host key) changed since the first connection. If you replaced or reinstalled it, press \"Trust again\" on the Backups page.";
  if (e?.name === "SftpPermissionError" || code === 3) return "Permission denied: the user can't write to that folder.";
  if (status === 404 || e?.name === "NotFound" || e?.name === "NoSuchBucket") return "Bucket not found: create it on the destination first.";
  if (status === 403 || e?.name === "Forbidden" || e?.name === "AccessDenied") return "Access denied: check the access key and that it is allowed on this bucket.";
  if (status === 400 && e?.name === "AuthorizationHeaderMalformed") return "Region mismatch: check the region setting.";
  return message || e?.name || "Unknown error";
}
