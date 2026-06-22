import type { FastifyInstance } from "fastify";
import type { IngestPasteInput, IngestUrlInput, UpdateNewsletterImportItemInput } from "@eesimple/types";
import { fetchBodyHtmlResult, isPublicHttpUrl } from "@/services/metadata";
import {
  approveImport,
  approveImportItem,
  contentFromUpload,
  deleteNewsletterImport,
  getNewsletterImport,
  ingestNewsletter,
  listNewsletterImports,
  rejectImportItem,
  updateImportItem,
} from "@/services/newsletterImports";
import { isValidUrl } from "@/utils/url";

const importParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const itemParams = {
  type: "object",
  required: ["id", "itemId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    itemId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const pasteBody = {
  type: "object",
  required: ["content"],
  additionalProperties: false,
  properties: {
    content: {
      type: "string",
      minLength: 1,
    },
    kind: {
      type: "string",
      enum: ["html", "text", "auto"],
    },
    title: {
      type: "string",
    },
    defaultCategoryId: {
      type: ["string", "null"],
    },
  },
} as const;

const urlBody = {
  type: "object",
  required: ["url"],
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    defaultCategoryId: {
      type: ["string", "null"],
    },
  },
} as const;

const uploadQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    defaultCategoryId: {
      type: "string",
    },
  },
} as const;

const updateItemBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    title: {
      type: ["string", "null"],
    },
    description: {
      type: ["string", "null"],
    },
    categoryId: {
      type: ["string", "null"],
    },
    status: {
      type: "string",
      enum: ["pending", "rejected"],
    },
  },
} as const;

/** Newsletter article ingest — paste / fetch-URL / upload, plus the review-queue CRUD. */
export async function newsletterRoutes(app: FastifyInstance): Promise<void> {
  // Paste newsletter HTML or plain text and extract candidate links.
  app.post("/api/newsletters/ingest/paste", {
    schema: {
      tags: ["newsletters"],
      body: pasteBody,
    },
  }, async (req) => {
    const body = req.body as IngestPasteInput;
    return ingestNewsletter({
      source: "paste",
      content: body.content,
      kind: body.kind ?? "auto",
      title: body.title ?? null,
      defaultCategoryId: body.defaultCategoryId ?? null,
    });
  });

  // Fetch a public "view in browser" newsletter post and extract its article links.
  app.post("/api/newsletters/ingest/url", {
    schema: {
      tags: ["newsletters"],
      body: urlBody,
    },
  }, async (req, reply) => {
    const body = req.body as IngestUrlInput;
    if (!isValidUrl(body.url) || !isPublicHttpUrl(body.url)) {
      return reply.code(400).send({
        message: "url must be a valid public http(s) URL",
      });
    }
    const result = await fetchBodyHtmlResult(body.url, /<\/body>/i);
    if (result.kind !== "ok") {
      return reply.code(502).send({
        message: "Could not fetch that newsletter page.",
        reason: result.kind,
      });
    }
    return ingestNewsletter({
      source: "url",
      content: result.html,
      kind: "html",
      // Parse the newsletter's own title from the fetched page; fall back to the URL.
      titleFallback: body.url,
      sourceUrl: body.url,
      defaultCategoryId: body.defaultCategoryId ?? null,
    });
  });

  // Upload a saved newsletter (.eml / .html / .txt) and extract its candidate links.
  app.post("/api/newsletters/ingest/upload", {
    schema: {
      tags: ["newsletters"],
      consumes: ["multipart/form-data"],
      querystring: uploadQuery,
    },
  }, async (req, reply) => {
    const {
      defaultCategoryId,
    } = req.query as { defaultCategoryId?: string };
    let filename: string;
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) return reply.code(400).send({
        message: "No file uploaded",
      });
      filename = file.filename;
      bytes = await file.toBuffer();
    }
    catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(413).send({
          message: "File is too large",
        });
      }
      throw err;
    }
    const parsed = contentFromUpload(filename, bytes);
    if (!parsed) {
      return reply.code(415).send({
        message: "Unsupported file — upload an .eml, .html, or .txt file",
      });
    }
    return ingestNewsletter({
      source: "upload",
      content: parsed.content,
      kind: parsed.kind,
      // The `.eml` Subject (or a parsed HTML title) wins; fall back to the filename.
      title: parsed.title,
      titleFallback: filename,
      defaultCategoryId: defaultCategoryId ?? null,
    });
  });

  // List all imports with per-status counts.
  app.get("/api/newsletters/imports", {
    schema: {
      tags: ["newsletters"],
    },
  }, () => listNewsletterImports());

  // Fetch one import with its candidate items.
  app.get("/api/newsletters/imports/:id", {
    schema: {
      tags: ["newsletters"],
      params: importParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const found = await getNewsletterImport(id);
    if (!found) return reply.code(404).send({
      message: "Newsletter import not found",
    });
    return found;
  });

  // Edit a staged candidate before approval.
  app.patch("/api/newsletters/imports/:id/items/:itemId", {
    schema: {
      tags: ["newsletters"],
      params: itemParams,
      body: updateItemBody,
    },
  }, async (req, reply) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    const updated = await updateImportItem(itemId, req.body as UpdateNewsletterImportItemInput);
    if (!updated) return reply.code(404).send({
      message: "Item not found",
    });
    return updated;
  });

  // Approve one candidate → create a bookmark.
  app.post("/api/newsletters/imports/:id/items/:itemId/approve", {
    schema: {
      tags: ["newsletters"],
      params: itemParams,
    },
  }, async (req) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    return approveImportItem(itemId);
  });

  // Approve every pending candidate in an import.
  app.post("/api/newsletters/imports/:id/approve", {
    schema: {
      tags: ["newsletters"],
      params: importParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return approveImport(id);
  });

  // Reject one candidate.
  app.post("/api/newsletters/imports/:id/items/:itemId/reject", {
    schema: {
      tags: ["newsletters"],
      params: itemParams,
    },
  }, async (req, reply) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    const ok = await rejectImportItem(itemId);
    if (!ok) return reply.code(404).send({
      message: "Item not found",
    });
    return reply.code(204).send();
  });

  // Delete an import and its items.
  app.delete("/api/newsletters/imports/:id", {
    schema: {
      tags: ["newsletters"],
      params: importParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const ok = await deleteNewsletterImport(id);
    if (!ok) return reply.code(404).send({
      message: "Newsletter import not found",
    });
    return reply.code(204).send();
  });
}
