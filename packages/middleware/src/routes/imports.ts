import type { FastifyInstance } from "fastify";
import type {
  BlockImportItemInput,
  IngestPasteInput,
  IngestUrlInput,
  IssueBookmarksInput,
  UpdateImportItemInput,
} from "@eesimple/types";
import { IMPORT_BLACKLIST_KINDS } from "@eesimple/types";
import { isPublicHttpUrl } from "@/services/metadata";
import {
  approveImport,
  approveImportItem,
  blockImportItem,
  contentFromUpload,
  deleteImport,
  deleteRejectedItems,
  getImport,
  listActiveImports,
  listImports,
  listInboxItems,
  purgeProcessedItems,
  queueImport,
  rejectImportItem,
  rejectPendingItems,
  setIssueBookmarks,
  unrejectImportItem,
  updateImportItem,
} from "@/services/imports";
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
  required: ["itemId"],
  properties: {
    itemId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const newsletterIdProp = {
  type: ["string", "null"],
  format: "uuid",
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
    newsletterId: newsletterIdProp,
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
    newsletterId: newsletterIdProp,
    defaultCategoryId: {
      type: ["string", "null"],
    },
  },
} as const;

const uploadQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    newsletterId: {
      type: "string",
      format: "uuid",
    },
    defaultCategoryId: {
      type: "string",
    },
  },
} as const;

const issueBookmarksBody = {
  type: "object",
  required: ["bookmarkIds"],
  additionalProperties: false,
  properties: {
    bookmarkIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
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

const blockItemBody = {
  type: "object",
  required: ["kind", "value"],
  additionalProperties: false,
  properties: {
    kind: {
      type: "string",
      enum: [...IMPORT_BLACKLIST_KINDS],
    },
    value: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** Imports: content ingest (paste / fetch-URL / upload) plus the Inbox review-queue CRUD. */
export async function importRoutes(app: FastifyInstance): Promise<void> {
  // Paste HTML or plain text and extract candidate links.
  app.post("/api/imports/ingest/paste", {
    schema: {
      tags: ["imports"],
      body: pasteBody,
    },
  }, async (req) => {
    const body = req.body as IngestPasteInput;
    return queueImport({
      source: "paste",
      content: body.content,
      kind: body.kind ?? "auto",
      title: body.title ?? null,
      newsletterId: body.newsletterId ?? null,
      defaultCategoryId: body.defaultCategoryId ?? null,
    });
  });

  // Queue a public webpage (article or "view in browser" newsletter): the page is fetched and its
  // article links extracted by the background worker, so this returns the queued import immediately.
  app.post("/api/imports/ingest/url", {
    schema: {
      tags: ["imports"],
      body: urlBody,
    },
  }, async (req, reply) => {
    const body = req.body as IngestUrlInput;
    if (!isValidUrl(body.url) || !isPublicHttpUrl(body.url)) {
      return reply.code(400).send({
        message: "url must be a valid public http(s) URL",
      });
    }
    return queueImport({
      source: "url",
      content: "",
      // The worker fetches this page off the request path.
      fetchUrl: body.url,
      kind: "html",
      // Refined to the page's own title once fetched; falls back to the URL.
      titleFallback: body.url,
      sourceUrl: body.url,
      newsletterId: body.newsletterId ?? null,
      defaultCategoryId: body.defaultCategoryId ?? null,
    });
  });

  // Upload a saved newsletter (.eml / .html / .txt) and extract its candidate links.
  app.post("/api/imports/ingest/upload", {
    schema: {
      tags: ["imports"],
      consumes: ["multipart/form-data"],
      querystring: uploadQuery,
    },
  }, async (req, reply) => {
    const {
      newsletterId, defaultCategoryId,
    } = req.query as { newsletterId?: string;
      defaultCategoryId?: string; };
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
    return queueImport({
      source: "upload",
      content: parsed.content,
      kind: parsed.kind,
      // The `.eml` Subject (or a parsed HTML title) wins; fall back to the filename.
      title: parsed.title,
      titleFallback: filename,
      newsletterId: newsletterId ?? null,
      defaultCategoryId: defaultCategoryId ?? null,
    });
  });

  // List all imports with per-status counts.
  app.get("/api/imports", {
    schema: {
      tags: ["imports"],
    },
  }, () => listImports());

  // List the imports currently in flight (queued/processing) with live progress — polled by the
  // header progress indicator.
  app.get("/api/imports/active", {
    schema: {
      tags: ["imports"],
    },
  }, () => listActiveImports());

  // List every import item across all imports (the Inbox), newest first.
  app.get("/api/imports/items", {
    schema: {
      tags: ["imports"],
    },
  }, () => listInboxItems());

  // Edit a staged candidate before approval.
  app.patch("/api/imports/items/:itemId", {
    schema: {
      tags: ["imports"],
      params: itemParams,
      body: updateItemBody,
    },
  }, async (req, reply) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    const updated = await updateImportItem(itemId, req.body as UpdateImportItemInput);
    if (!updated) return reply.code(404).send({
      message: "Item not found",
    });
    return updated;
  });

  // Approve one candidate → create a bookmark (and flag the item for deletion).
  app.post("/api/imports/items/:itemId/approve", {
    schema: {
      tags: ["imports"],
      params: itemParams,
    },
  }, async (req) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    return approveImportItem(itemId);
  });

  // Reject one candidate.
  app.post("/api/imports/items/:itemId/reject", {
    schema: {
      tags: ["imports"],
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

  // Unreject one candidate → restore it to pending for re-review.
  app.post("/api/imports/items/:itemId/unreject", {
    schema: {
      tags: ["imports"],
      params: itemParams,
    },
  }, async (req, reply) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    const ok = await unrejectImportItem(itemId);
    if (!ok) return reply.code(404).send({
      message: "Item not found",
    });
    return reply.code(204).send();
  });

  // Block one candidate → add its URL to the Imports Blacklist and mark it blocked.
  app.post("/api/imports/items/:itemId/block", {
    schema: {
      tags: ["imports"],
      params: itemParams,
      body: blockItemBody,
    },
  }, async (req, reply) => {
    const {
      itemId,
    } = req.params as { itemId: string };
    const updated = await blockImportItem(itemId, req.body as BlockImportItemInput);
    if (!updated) return reply.code(404).send({
      message: "Item not found",
    });
    return updated;
  });

  // Reject every pending candidate across all imports (the Inbox "reject all pending" action).
  app.post("/api/imports/items/pending/reject", {
    schema: {
      tags: ["imports"],
    },
  }, () => rejectPendingItems());

  // Delete every processed item: marked-for-deletion (approved) + blocked. Keeps the blacklist.
  app.delete("/api/imports/items/processed", {
    schema: {
      tags: ["imports"],
    },
  }, () => purgeProcessedItems());

  // Delete every rejected candidate across all imports (the Inbox "delete all rejected" action).
  app.delete("/api/imports/items/rejected", {
    schema: {
      tags: ["imports"],
    },
  }, () => deleteRejectedItems());

  // Approve every pending candidate in an import.
  app.post("/api/imports/:id/approve", {
    schema: {
      tags: ["imports"],
      params: importParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return approveImport(id);
  });

  // Manually associate bookmarks with an import.
  app.post("/api/imports/:id/bookmarks", {
    schema: {
      tags: ["imports"],
      params: importParams,
      body: issueBookmarksBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!(await getImport(id))) return reply.code(404).send({
      message: "Import not found",
    });
    await setIssueBookmarks(id, (req.body as IssueBookmarksInput).bookmarkIds, "add");
    return reply.code(204).send();
  });

  // Disassociate bookmarks from an import.
  app.delete("/api/imports/:id/bookmarks", {
    schema: {
      tags: ["imports"],
      params: importParams,
      body: issueBookmarksBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    await setIssueBookmarks(id, (req.body as IssueBookmarksInput).bookmarkIds, "remove");
    return reply.code(204).send();
  });

  // Fetch one import with its candidate items.
  app.get("/api/imports/:id", {
    schema: {
      tags: ["imports"],
      params: importParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const found = await getImport(id);
    if (!found) return reply.code(404).send({
      message: "Import not found",
    });
    return found;
  });

  // Delete an import and its items.
  app.delete("/api/imports/:id", {
    schema: {
      tags: ["imports"],
      params: importParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const ok = await deleteImport(id);
    if (!ok) return reply.code(404).send({
      message: "Import not found",
    });
    return reply.code(204).send();
  });
}
