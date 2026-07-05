import type { FastifyInstance } from "fastify";
import { bulkAutoFetchImages, bulkAutoFetchWithScreenshotFallback, setBookmarkImage } from "@/services/bookmarkImages";
import { deleteOrphans, forgetManifestObject, getCatalog, MANAGED_PREFIX, scanBucket, verifyIsOrphan } from "@/services/gallery";
import { getAutoFetchJobStatus, getScreenshotFallbackJobStatus, setAutoFetchJobStatus, setScreenshotFallbackJobStatus } from "@/services/imageAutoFetchState";
import { deleteObject, getObjectBytes, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { AppError, NotFoundError, StorageUnconfiguredError, ValidationError } from "@/utils/errors";

const deleteOrphansBody = {
  type: "object",
  required: ["keys"],
  additionalProperties: false,
  properties: {
    keys: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
    },
  },
} as const;

const attachBody = {
  type: "object",
  required: ["key", "bookmarkId"],
  additionalProperties: false,
  properties: {
    key: {
      type: "string",
      minLength: 1,
    },
    bookmarkId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const imageQuery = {
  type: "object",
  required: ["key"],
  additionalProperties: false,
  properties: {
    key: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** Routes for the Gallery: the bucket manifest, scan/reconcile, orphan cleanup, and by-key serving. */
export async function galleryRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/gallery", {
    schema: {
      tags: ["gallery"],
    },
  }, async () => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    return getCatalog();
  });

  app.post("/api/gallery/scan", {
    schema: {
      tags: ["gallery"],
    },
  }, async () => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    return scanBucket();
  });

  app.delete("/api/gallery/orphans", {
    schema: {
      tags: ["gallery"],
      body: deleteOrphansBody,
    },
  }, async (req) => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    const {
      keys,
    } = req.body as { keys: string[] };
    return deleteOrphans(keys);
  });

  // Re-link an orphaned object to a bookmark. Downloads the orphan's bytes, re-processes and stores
  // them under the bookmark's canonical key, then removes the old orphan. Orchestrated here rather
  // than in the gallery service to avoid a circular import with bookmarkImages.
  app.post("/api/gallery/attach", {
    schema: {
      tags: ["gallery"],
      body: attachBody,
    },
  }, async (req) => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    const {
      key, bookmarkId,
    } = req.body as { key: string;
      bookmarkId: string; };

    if (!key.startsWith(MANAGED_PREFIX)) {
      throw new ValidationError("Invalid key");
    }

    const isOrphan = await verifyIsOrphan(key);
    if (!isOrphan) {
      throw new AppError("Image is not an orphan or does not exist in the manifest", "conflict", 409);
    }

    const bytes = await getObjectBytes(key);
    if (!bytes) {
      throw new AppError("Object is missing from storage", "internal", 502);
    }

    const result = await setBookmarkImage(bookmarkId, bytes, "upload");
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "bad_image") {
      throw new AppError("Stored object is not a valid image", "unsupportedImage", 415);
    }

    // Remove the old orphan key when it differs from the bookmark's canonical key.
    const canonicalKey = `${MANAGED_PREFIX}${bookmarkId}.webp`;
    if (key !== canonicalKey) {
      await deleteObject(key);
      await forgetManifestObject(key);
    }

    return result;
  });

  // Bulk auto-fetch: start a background job and return immediately.
  // A second POST while a job is running returns 409.
  app.post("/api/gallery/auto-fetch", {
    schema: {
      tags: ["gallery"],
    },
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    if (getAutoFetchJobStatus().status === "running" || getScreenshotFallbackJobStatus().status === "running") {
      throw new AppError("An auto-fetch job is already in progress", "conflict", 409);
    }

    // Kick off the job in the background without awaiting.
    setAutoFetchJobStatus({
      status: "running",
      totalCount: 0,
      processedCount: 0,
    });
    void bulkAutoFetchImages((processed, total) => {
      setAutoFetchJobStatus({
        status: "running",
        totalCount: total,
        processedCount: processed,
      });
    }).then((result) => {
      setAutoFetchJobStatus({
        status: "done",
        ...result,
      });
    }).catch(() => {
      setAutoFetchJobStatus({
        status: "idle",
      });
    });

    return reply.code(202).send(getAutoFetchJobStatus());
  });

  // Return the current status of the background auto-fetch job.
  app.get("/api/gallery/auto-fetch/status", {
    schema: {
      tags: ["gallery"],
    },
  }, async () => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    return getAutoFetchJobStatus();
  });

  // Bulk auto-fetch with screenshot fallback: try og:image first; if that fails, capture a
  // screenshot. A second POST while a job is running (either this or the plain auto-fetch) returns
  // 409.
  app.post("/api/gallery/auto-fetch-screenshot-fallback", {
    schema: {
      tags: ["gallery"],
    },
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    if (getAutoFetchJobStatus().status === "running" || getScreenshotFallbackJobStatus().status === "running") {
      throw new AppError("An auto-fetch job is already in progress", "conflict", 409);
    }

    setScreenshotFallbackJobStatus({
      status: "running",
      totalCount: 0,
      processedCount: 0,
    });
    void bulkAutoFetchWithScreenshotFallback((processed, total) => {
      setScreenshotFallbackJobStatus({
        status: "running",
        totalCount: total,
        processedCount: processed,
      });
    }).then((result) => {
      setScreenshotFallbackJobStatus({
        status: "done",
        ...result,
      });
    }).catch(() => {
      setScreenshotFallbackJobStatus({
        status: "idle",
      });
    });

    return reply.code(202).send(getScreenshotFallbackJobStatus());
  });

  // Return the current status of the screenshot-fallback bulk auto-fetch job.
  app.get("/api/gallery/auto-fetch-screenshot-fallback/status", {
    schema: {
      tags: ["gallery"],
    },
  }, async () => {
    if (!isObjectStoreConfigured()) throw new StorageUnconfiguredError();
    return getScreenshotFallbackJobStatus();
  });

  // Serve an arbitrary object by key so orphan thumbnails (which have no bookmark) can be previewed.
  // Guarded to the managed prefix so this can't be used to read outside the app's own objects.
  app.get("/api/gallery/image", {
    schema: {
      tags: ["gallery"],
      querystring: imageQuery,
    },
  }, async (req, reply) => {
    const {
      key,
    } = req.query as { key: string };
    if (!key.startsWith(MANAGED_PREFIX)) {
      throw new ValidationError("Invalid key");
    }
    const object = await getObjectStream(key);
    if (!object) {
      throw new NotFoundError("Item", "Not found");
    }
    if (object.contentType) reply.header("Content-Type", object.contentType);
    reply.header("Cache-Control", "private, max-age=60");
    return reply.send(object.body);
  });
}
