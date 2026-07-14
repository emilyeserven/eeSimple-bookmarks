import type { FastifyInstance } from "fastify";
import {
  getBookmarkPropertyFileRow,
  removeBookmarkPropertyFile,
  setBookmarkPropertyFile,
} from "@/services/bookmarkPropertyFiles";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import { AppError, ImageTooLargeError, NoFileUploadedError, NotFoundError, StorageUnconfiguredError } from "@/utils/errors";
import { propertyFileParams } from "./bookmarksSchema";

/** Custom-property image/file value upload, removal, and download. */
export function registerBookmarkPropertyFileRoutes(app: FastifyInstance): void {
  // Upload an image/file value for a bookmark's image/file custom property (multipart). Replaces any
  // existing value. Mirrors the bookmark-image upload route, keyed additionally by propertyId.
  app.post("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError("File storage is not configured");
    }
    let bytes: Buffer;
    let contentType = "application/octet-stream";
    let originalFilename: string | null = null;
    try {
      const file = await req.file();
      if (!file) {
        throw new NoFileUploadedError();
      }
      contentType = file.mimetype || contentType;
      originalFilename = file.filename || null;
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError("File is too large");
      }
      throw err;
    }
    const result = await setBookmarkPropertyFile(id, propertyId, bytes, contentType, originalFilename);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark", "Bookmark or property not found");
    }
    if (result === "wrong_type") {
      throw new AppError("Property is not an image or file type", "validation", 422);
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Remove a bookmark's image/file property value.
  app.delete("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    const removed = await removeBookmarkPropertyFile(id, propertyId);
    if (!removed) {
      throw new NotFoundError("File", "No file to delete");
    }
    return reply.code(204).send();
  });

  // Serve a bookmark's image/file property value bytes by streaming them from object storage. The URL
  // carries a `?v=` version param, so it's safe to cache immutably — a replaced value gets a new URL.
  // For non-image `file` values, a Content-Disposition header preserves the original download name.
  app.get("/api/bookmarks/:id/properties/:propertyId/file", {
    schema: {
      tags: ["images"],
      params: propertyFileParams,
    },
  }, async (req, reply) => {
    const {
      id, propertyId,
    } = req.params as { id: string;
      propertyId: string; };
    const row = await getBookmarkPropertyFileRow(id, propertyId);
    if (!row) {
      throw new NotFoundError("File", "No file");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("File", "No file");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    // Images render inline; other files download with their original name when one is known.
    if (!row.contentType.startsWith("image/") && row.originalFilename) {
      const safeName = row.originalFilename.replace(/["\\\r\n]/g, "_");
      reply.header("Content-Disposition", `attachment; filename="${safeName}"`);
    }
    return reply.send(object.body);
  });
}
