import type { FastifyInstance } from "fastify";
import type { CreateWebsiteInput, UpdateWebsiteInput, WebsiteLookup } from "@eesimple/types";
import {
  fetchAndStoreWebsiteFavicon,
  getWebsiteFaviconRow,
  removeWebsiteFavicon,
  setWebsiteFaviconFromBytes,
} from "@/services/websiteFavicons";
import {
  BuiltInWebsiteError,
  createWebsite,
  deleteWebsite,
  DuplicateDomainError,
  InvalidDomainError,
  listWebsites,
  lookupWebsiteByUrl,
  updateWebsite,
} from "@/services/websites";
import { deleteObject, getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";

/** User-facing messages for the typed grab failures shared by the entity-image auto routes. */
const IMAGE_GRAB_ERROR_MESSAGES: Record<string, string> = {
  no_image: "No image found for that site",
  bad_image: "Image couldn't be loaded",
  blocked: "Access to the site was blocked",
  server_error: "Site returned a server error",
  fetch_error: "Site couldn't be reached",
};

const websiteParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const lookupQuery = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const shortenedLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["domain", "expandTo", "keepShortened"],
    additionalProperties: false,
    properties: {
      domain: {
        type: "string",
        minLength: 1,
      },
      expandTo: {
        type: ["string", "null"],
      },
      keepShortened: {
        type: "boolean",
      },
    },
  },
} as const;

const paramRulesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["pathSuffix", "params"],
    additionalProperties: false,
    properties: {
      pathSuffix: {
        type: "string",
      },
      params: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
} as const;

const createWebsiteBody = {
  type: "object",
  required: ["domain"],
  additionalProperties: false,
  properties: {
    domain: {
      type: "string",
      minLength: 1,
    },
    siteName: {
      type: "string",
      minLength: 1,
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
  },
} as const;

const updateWebsiteBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    siteName: {
      type: "string",
      minLength: 1,
    },
    domain: {
      type: "string",
      minLength: 1,
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
    categoryId: {
      type: ["string", "null"],
      format: "uuid",
    },
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** Routes for the built-in Websites taxonomy, mounted under `/api/websites`. */
export async function websiteRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/websites", {
    schema: {
      tags: ["websites"],
    },
  }, async () => listWebsites());

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
      shortener,
    };
    return result;
  });

  app.post("/api/websites", {
    schema: {
      tags: ["websites"],
      body: createWebsiteBody,
    },
  }, async (req, reply) => {
    try {
      const website = await createWebsite(req.body as CreateWebsiteInput);
      return reply.code(201).send(website);
    }
    catch (err) {
      if (err instanceof DuplicateDomainError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof InvalidDomainError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/websites/:id", {
    schema: {
      tags: ["websites"],
      params: websiteParams,
      body: updateWebsiteBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const website = await updateWebsite(id, req.body as UpdateWebsiteInput);
      if (!website) return reply.code(404).send({
        message: "Website not found",
      });
      return website;
    }
    catch (err) {
      if (err instanceof DuplicateDomainError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInWebsiteError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    try {
      // Read the favicon row before deleting: the row cascades away with the website, but its bytes
      // live under an object-storage prefix the Gallery reconciliation doesn't cover, so capture the
      // key now and drop the object after a confirmed delete (best-effort) to avoid leaking it.
      const faviconRow = await getWebsiteFaviconRow(id);
      const deleted = await deleteWebsite(id);
      if (!deleted) return reply.code(404).send({
        message: "Website not found",
      });
      if (faviconRow) await deleteObject(faviconRow.objectKey).catch(() => undefined);
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInWebsiteError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
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
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) {
        return reply.code(400).send({
          message: "No file uploaded",
        });
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      // @fastify/multipart throws this when the upload exceeds the configured size limit.
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          message: "Image is too large",
        });
      }
      throw err;
    }
    const result = await setWebsiteFaviconFromBytes(id, bytes);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Website not found",
      });
    }
    if (result === "bad_image") {
      return reply.code(415).send({
        message: "Unsupported or invalid image",
      });
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
      return reply.code(503).send({
        message: "Image storage is not configured",
      });
    }
    const result = await fetchAndStoreWebsiteFavicon(id);
    if (result === "not_found") {
      return reply.code(404).send({
        message: "Website not found",
      });
    }
    if (typeof result === "string") {
      return reply.code(502).send({
        message: IMAGE_GRAB_ERROR_MESSAGES[result] ?? "Could not fetch a favicon",
        code: result,
      });
    }
    return reply.code(201).send(result);
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
      return reply.code(404).send({
        message: "No favicon to delete",
      });
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
      return reply.code(404).send({
        message: "No favicon",
      });
    }
    const object = await getObjectStream(row.objectKey);
    if (!object) {
      return reply.code(404).send({
        message: "No favicon",
      });
    }
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
