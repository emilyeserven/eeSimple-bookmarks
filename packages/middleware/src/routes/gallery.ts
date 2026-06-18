import type { FastifyInstance } from "fastify";
import { deleteOrphans, getCatalog, MANAGED_PREFIX, scanBucket } from "@/services/gallery";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

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
