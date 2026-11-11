/**
 * The backup destination: an S3-compatible bucket on another machine (Garage, MinIO, or any S3 API),
 * usually reached over a Tailscale address. Unlike `objectStore.ts` (the app's own image bucket,
 * configured by env vars), this client is built per run from Settings → Advanced → Backups.
 *
 * The endpoint is operator-configured, so it is deliberately allowed to be a private/tailnet address:
 * the AWS SDK connects with Node's own HTTP stack, not the SSRF-guarded `guardedFetch`.
 */

import type { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { BackupDestination } from "@/services/backupConfig";

/** A destination client plus the bucket it writes to. */
export interface BackupStore {
  client: S3Client;
  bucket: string;
}

export function createBackupStore(dest: BackupDestination): BackupStore {
  return {
    bucket: dest.bucket,
    client: new S3Client({
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
    }),
  };
}

/** Upload a stream of known length to `key`. */
export async function putBackupObject(
  store: BackupStore,
  key: string,
  body: Readable,
  contentLength: number,
  contentType = "application/octet-stream",
): Promise<void> {
  await store.client.send(new PutObjectCommand({
    Bucket: store.bucket,
    Key: key,
    Body: body,
    ContentLength: contentLength,
    ContentType: contentType,
  }));
}

/** An object listed at the destination. */
export interface BackupObjectInfo {
  key: string;
  size: number;
  lastModified: Date | null;
}

/** Every object under `prefix`, across all pages. */
export async function listBackupObjects(store: BackupStore, prefix: string): Promise<BackupObjectInfo[]> {
  const out: BackupObjectInfo[] = [];
  let token: string | undefined;
  do {
    const res = await store.client.send(new ListObjectsV2Command({
      Bucket: store.bucket,
      Prefix: prefix,
      ContinuationToken: token,
    }));
    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        out.push({
          key: obj.Key,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified ?? null,
        });
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

export async function deleteBackupObject(store: BackupStore, key: string): Promise<void> {
  await store.client.send(new DeleteObjectCommand({
    Bucket: store.bucket,
    Key: key,
  }));
}

/** Throws when the bucket can't be reached with these credentials. */
export async function checkBackupBucket(store: BackupStore): Promise<void> {
  await store.client.send(new HeadBucketCommand({
    Bucket: store.bucket,
  }));
}

/**
 * A readable English reason for an S3/network failure. HeadBucket errors carry no body, so the SDK's
 * message is often just the status name; map the common cases to something actionable.
 */
export function describeBackupStoreError(err: unknown): string {
  const e = err as {
    name?: string;
    code?: string;
    message?: string;
    $metadata?: { httpStatusCode?: number };
    cause?: { code?: string };
  } | null;
  const status = e?.$metadata?.httpStatusCode;
  const code = e?.code ?? e?.cause?.code;
  if (code === "ECONNREFUSED") return "Connection refused: is the S3 server running on that address and port?";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "Host not found: check the endpoint address (and that Tailscale is up on both machines).";
  if (code === "ETIMEDOUT" || code === "EHOSTUNREACH") return "Timed out reaching the endpoint: check that both machines are on the tailnet.";
  if (status === 404 || e?.name === "NotFound" || e?.name === "NoSuchBucket") return "Bucket not found: create it on the destination first.";
  if (status === 403 || e?.name === "Forbidden" || e?.name === "AccessDenied") return "Access denied: check the access key and that it is allowed on this bucket.";
  if (status === 400 && e?.name === "AuthorizationHeaderMalformed") return "Region mismatch: check the region setting.";
  return e?.message || e?.name || "Unknown error";
}
