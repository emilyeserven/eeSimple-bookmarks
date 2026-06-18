/**
 * Thin, swappable wrapper around an S3-compatible object store (Garage in production, but any
 * S3 API works — MinIO, AWS S3). Keeping every call behind these few functions means the storage
 * backend can change with config alone, and the rest of the app never imports the AWS SDK directly.
 */

import type { Readable } from "node:stream";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "garage";
const bucket = process.env.S3_BUCKET ?? "bookmarks";
const accessKeyId = process.env.S3_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY ?? "";

/**
 * Whether the object store is configured enough to use. When false, image routes return 503
 * instead of crashing, so the rest of the API still works without storage provisioned.
 */
export function isObjectStoreConfigured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  client ??= new S3Client({
    endpoint,
    region,
    // Garage and MinIO require path-style addressing (no virtual-hosted buckets).
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  return client;
}

/** The pieces of a fetched object the serving route needs. */
export interface StoredObject {
  body: Readable;
  contentType?: string;
  contentLength?: number;
}

/** Store (or overwrite) the bytes at `key`. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getClient().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

/** Fetch the object at `key` as a stream, or null when it doesn't exist. */
export async function getObjectStream(key: string): Promise<StoredObject | null> {
  try {
    const res = await getClient().send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
    if (!res.Body) return null;
    return {
      body: res.Body as Readable,
      contentType: res.ContentType,
      contentLength: res.ContentLength,
    };
  }
  catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Delete the object at `key`. A missing object is treated as success. */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
  }
  catch (err) {
    if (!isNotFound(err)) throw err;
  }
}

/** Create the configured bucket if it doesn't already exist. Safe to call on every boot. */
export async function ensureBucket(): Promise<void> {
  const s3 = getClient();
  try {
    await s3.send(new HeadBucketCommand({
      Bucket: bucket,
    }));
  }
  catch (err) {
    if (!isNotFound(err)) throw err;
    await s3.send(new CreateBucketCommand({
      Bucket: bucket,
    }));
  }
}

/** The AWS SDK surfaces "missing" via a few error shapes depending on the operation. */
function isNotFound(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name;
  const status = (err as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata?.httpStatusCode;
  return name === "NotFound" || name === "NoSuchKey" || name === "NoSuchBucket" || status === 404;
}
