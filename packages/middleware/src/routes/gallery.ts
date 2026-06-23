import type { FastifyInstance } from "fastify";
import { bulkAutoFetchImages, setBookmarkImage } from "@/services/bookmarkImages";
import { deleteOrphans, forgetManifestObject, getCatalog, MANAGED_PREFIX, scanBucket, verifyIsOrphan } from "@/services/gallery";
import { getAutoFetchJobStatus, setAutoFetchJobStatus } from "@/services/imageAutoFetchState";
import { deleteObject, getObjectBytes, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

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

const notConfigured = {
  message: "Image storage is not configured",
};

/** Routes for the Gallery: the bucket manifest, scan/reconcile, orphan cleanup, and by-key serving. */
export async function galleryRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/gallery", {
    schema: {
      tags: ["gallery"],
    },
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
    return getCatalog();
  });

  app.post("/api/gallery/scan", {
    schema: {
      tags: ["gallery"],
    },
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
    return scanBucket();
  });

  app.delete("/api/gallery/orphans", {
    schema: {
      tags: ["gallery"],
      body: deleteOrphansBody,
    },
  }, async (req, reply) => {
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
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
  }, async (req, reply) => {
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
    const {
      key, bookmarkId,
    } = req.body as { key: string;
      bookmarkId: string; };

    if (!key.startsWith(MANAGED_PREFIX)) {
      return reply.code(400).send({
        message: "Invalid key",
      });
    }

    const isOrphan = await verifyIsOrphan(key);
    if (!isOrphan) {
      return reply.code(409).send({
        message: "Image is not an orphan or does not exist in the manifest",
      });
    }

    const bytes = await getObjectBytes(key);
    if (!bytes) {
      return reply.code(502).send({
        message: "Object is missing from storage",
      });
    }

    const result = await setBookmarkImage(bookmarkId, bytes, "upload");
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Bookmark not found",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Stored object is not a valid image",
      });
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
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
    const current = getAutoFetchJobStatus();
    if (current.status === "running") {
      return reply.code(409).send({
        message: "Auto-fetch already in progress",
      });
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
  }, async (_req, reply) => {
    if (!isObjectStoreConfigured()) return reply.code(503).send(notConfigured);
    return getAutoFetchJobStatus();
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
      return reply.code(400).send({
        message: "Invalid key",
      });
    }
    const object = await getObjectStream(key);
    if (!object) {
      return reply.code(404).send({
        message: "Not found",
      });
    }
    if (object.contentType) reply.header("Content-Type", object.contentType);
    reply.header("Cache-Control", "private, max-age=60");
    return reply.send(object.body);
  });
}
