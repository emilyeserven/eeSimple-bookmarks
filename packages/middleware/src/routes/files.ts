import type { FastifyInstance } from "fastify";

import { randomUUID } from "node:crypto";
import { NoFileUploadedError, NotFoundError, StorageUnconfiguredError } from "@/utils/errors";
import { deleteObject, getObjectStream, isObjectStoreConfigured, listObjects, putObject } from "@/utils/objectStore";

/**
 * Minimal file storage over the S3-compatible object store (Garage by default). Every route
 * returns 503 `storageUnconfigured` until the `S3_*` env vars are set, so the rest of the API works
 * without storage provisioned. Extend or delete this module to fit the project.
 */
const PREFIX = "uploads/";

const keyParams = {
  type: "object",
  required: ["key"],
  properties: {
    key: {
      type: "string",
      pattern: "^[A-Za-z0-9._-]+$",
    },
  },
} as const;

const tags = ["files"];

function requireStorage(): void {
  if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
}

export async function fileRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/files", {
    schema: {
      tags,
    },
  }, async () => {
    requireStorage();
    const objects = await listObjects(PREFIX);
    return objects.map(obj => ({
      key: obj.key.slice(PREFIX.length),
      size: obj.size ?? null,
      lastModified: obj.lastModified?.toISOString() ?? null,
    }));
  });

  app.post("/api/files", {
    schema: {
      tags,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    requireStorage();
    const file = await req.file();
    if (!file) throw new NoFileUploadedError();
    const ext = file.filename.includes(".") ? file.filename.slice(file.filename.lastIndexOf(".")).replace(/[^A-Za-z0-9.]/g, "") : "";
    const key = `${randomUUID()}${ext}`;
    await putObject(`${PREFIX}${key}`, await file.toBuffer(), file.mimetype);
    return reply.code(201).send({
      key,
    });
  });

  app.get<{ Params: { key: string } }>("/api/files/:key", {
    schema: {
      tags,
      params: keyParams,
    },
  }, async (req, reply) => {
    requireStorage();
    const stored = await getObjectStream(`${PREFIX}${req.params.key}`);
    if (!stored) throw new NotFoundError("File");
    if (stored.contentType) reply.type(stored.contentType);
    if (stored.contentLength !== undefined) reply.header("content-length", stored.contentLength);
    return reply.send(stored.body);
  });

  app.delete<{ Params: { key: string } }>("/api/files/:key", {
    schema: {
      tags,
      params: keyParams,
    },
  }, async (req, reply) => {
    requireStorage();
    await deleteObject(`${PREFIX}${req.params.key}`);
    return reply.code(204).send();
  });
}
