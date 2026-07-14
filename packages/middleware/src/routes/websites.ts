import type { FastifyInstance } from "fastify";
import type { CreateWebsiteInput, UpdateWebsiteInput, WebsiteLookup } from "@eesimple/types";
import {
  fetchAndStoreWebsiteFavicon,
  getWebsiteFaviconRow,
  removeWebsiteFavicon,
  resolveWebsiteFaviconUrl,
  setWebsiteFaviconFromBytes,
} from "@/services/websiteFavicons";
import {
  bulkDeleteWebsites,
  bulkUpdateWebsites,
  bulkUpdateWebsiteTags,
  createWebsite,
  deleteWebsite,
  getWebsite,
  getWebsiteTree,
  listRedirectFailureWebsites,
  listWebsites,
  lookupWebsiteByUrl,
  updateWebsite,
} from "@/services/websites";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import {
  bulkTagsBody,
  bulkUpdateBody,
  createWebsiteBody,
  lookupQuery,
  updateWebsiteBody,
  websiteParams,
} from "@/routes/websitesSchema";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import {
  ImageTooLargeError,
  NoFileUploadedError,
  NotFoundError,
  StorageUnconfiguredError,
  UnsupportedImageError,
} from "@/utils/errors";

/** User-facing messages for the typed grab failures shared by the entity-image auto routes. */
const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No image found for that site",
  bad_image: "Image couldn't be loaded",
  blocked: "Access to the site was blocked",
  server_error: "Site returned a server error",
  fetch_error: "Site couldn't be reached",
};

/** Routes for the built-in Websites taxonomy, mounted under `/api/websites`. */
export async function websiteRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/websites", "websites", bulkDeleteWebsites);

  app.post("/api/websites/bulk", {
    schema: {
      tags: ["websites"],
      body: bulkUpdateBody,
    },
  }, async (req) => {
    const {
      ids, patch,
    } = req.body as { ids: string[];
      patch: UpdateWebsiteInput; };
    return bulkUpdateWebsites(ids, patch);
  });

  app.post("/api/websites/bulk-tags", {
    schema: {
      tags: ["websites"],
      body: bulkTagsBody,
    },
  }, async (req) => {
    const {
      ids, tagIds, op,
    } = req.body as { ids: string[];
      tagIds: string[];
      op: "add" | "remove"; };
    return bulkUpdateWebsiteTags(ids, tagIds, op);
  });

  app.get("/api/websites", {
    schema: {
      tags: ["websites"],
    },
  }, async () => listWebsites());

  app.get("/api/websites/tree", {
    schema: {
      tags: ["websites"],
    },
  }, async () => getWebsiteTree());

  app.get("/api/websites/lookup", {
    schema: {
      tags: ["websites"],
      querystring: lookupQuery,
    },
  }, async (req) => {
    const {
      url,
    } = req.query as { url: string };
    const {
      domain, website, shortener,
    } = await lookupWebsiteByUrl(url);
    const result: WebsiteLookup = {
      domain,
      exists: website !== null,
      siteName: website?.siteName ?? null,
      mediaTypeId: website?.mediaTypeId ?? null,
      shortener,
    };
    return result;
  });

  app.get("/api/websites/redirect-failures", {
    schema: {
      tags: ["websites"],
    },
  }, async () => listRedirectFailureWebsites());

  app.post("/api/websites", {
    schema: {
      tags: ["websites"],
      body: createWebsiteBody,
    },
  }, async (req, reply) => {
    const website = await createWebsite(req.body as CreateWebsiteInput);
    return reply.code(201).send(website);
  });

  app.patch("/api/websites/:id", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
      body: updateWebsiteBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const website = await updateWebsite(id, req.body as UpdateWebsiteInput);
    if (!website) throw new NotFoundError("Website");
    return website;
  });

  app.delete("/api/websites/:id", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    // Read the favicon row before deleting: the row cascades away with the website, but its bytes
    // live under an object-storage prefix the Gallery reconciliation doesn't cover, so capture the
    // key now and drop the object after a confirmed delete (best-effort) to avoid leaking it.
    const faviconRow = await getWebsiteFaviconRow(id);
    const deleted = await deleteWebsite(id);
    if (!deleted) throw new NotFoundError("Website");
    if (faviconRow) await deleteObject(faviconRow.objectKey).catch(() => undefined);
    return reply.code(204).send();
  });

  // Upload a favicon for a website (multipart). Replaces any existing one.
  app.post("/api/websites/:id/image", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) {
        throw new NoFileUploadedError();
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await setWebsiteFaviconFromBytes(id, bytes);
    if (result === "not_found") {
      throw new NotFoundError("Website");
    }
    if (result === "bad_image") {
      throw new UnsupportedImageError();
    }
    return reply.code(201).send(result);
  });

  // Auto-capture: fetch the site's favicon (from its homepage) and store it.
  app.post("/api/websites/:id/image/auto", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = await fetchAndStoreWebsiteFavicon(id);
    if (result === "not_found") {
      throw new NotFoundError("Website");
    }
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch a favicon",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Preview the site's source favicon URL WITHOUT storing it, so the client can show the NEW favicon
  // before applying. Resolves the same candidate `POST /:id/image/auto` would grab.
  app.get("/api/websites/:id/image/source-preview", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const website = await getWebsite(id);
    if (!website) {
      throw new NotFoundError("Website");
    }
    return {
      imageUrl: await resolveWebsiteFaviconUrl(id),
    };
  });

  // Remove a website's favicon.
  app.delete("/api/websites/:id/image", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeWebsiteFavicon(id);
    if (!removed) {
      throw new NotFoundError("Favicon", "No favicon to delete");
    }
    return reply.code(204).send();
  });

  // Serve a website's favicon bytes by streaming them from object storage. The `?v=` version param
  // makes the response safe to cache immutably — a replaced favicon gets a new URL.
  app.get("/api/websites/:id/image", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const row = await getWebsiteFaviconRow(id);
    if (!row) {
      throw new NotFoundError("Favicon", "No favicon");
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      throw new NotFoundError("Favicon", "No favicon");
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
