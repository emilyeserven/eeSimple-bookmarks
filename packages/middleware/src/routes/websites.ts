import type { FastifyInstance } from "fastify";
import type { CreateWebsiteInput, UpdateWebsiteInput, WebsiteLookup } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS, TAXONOMY_ENTITY_ASSOCIATIONS, TAXONOMY_ENTITY_FIELDS, TAXONOMY_ENTITY_WRITE_KEYS, WEBSITE_SCAN_OBSERVATION_KINDS } from "@eesimple/types";
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
import { labeledWebsitesSchema } from "@/routes/labeledWebsitesSchema";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
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
      matchMode: {
        type: "string",
        enum: ["suffix", "contains"],
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
    description: {
      type: ["string", "null"],
    },
    shortenedLinks: shortenedLinksSchema,
    paramRules: paramRulesSchema,
  },
} as const;

const alternateNamesSchema = {
  type: "array",
  items: {
    type: "string",
    minLength: 1,
  },
} as const;

const textMatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "value"],
  properties: {
    mode: {
      type: "string",
      enum: ["equals", "contains", "regex"],
    },
    value: {
      type: "string",
    },
    caseSensitive: {
      type: "boolean",
    },
  },
} as const;

/**
 * The extension-fill discriminated unions below use a merged-properties `object` + `allOf`
 * `if`/`then` per `kind`, NOT a `oneOf` of per-kind branches. Fastify's default AJV options set
 * `removeAdditional: true`, and `oneOf` evaluates every branch to confirm exactly one matches — so
 * a wrong branch with `additionalProperties: false` permanently strips any of the payload's real
 * properties it doesn't recognize *before* failing, corrupting (or outright rejecting) an
 * otherwise-valid payload for a sibling `kind` whose required fields happen to be a superset of an
 * earlier-evaluated branch's (see https://ajv.js.org/guide/modifying-data.html). `if`/`then`
 * sidesteps this: one `additionalProperties: false` pass over the union of every kind's fields,
 * with per-kind required-field enforcement layered on top.
 */
const fillFilterSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["selfText", "siblingText", "ancestorText", "closest", "nth"],
    },
    match: textMatchSchema,
    maxDepth: {
      type: "number",
    },
    selector: {
      type: "string",
    },
    index: {
      type: "number",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "selfText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "siblingText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "ancestorText",
          },
        },
      },
      then: {
        required: ["kind", "match"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "closest",
          },
        },
      },
      then: {
        required: ["kind", "selector"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "nth",
          },
        },
      },
      then: {
        required: ["kind", "index"],
      },
    },
  ],
} as const;

const fillTransformSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["regex", "number", "duration", "date", "replace", "trim"],
    },
    pattern: {
      type: "string",
    },
    flags: {
      type: "string",
    },
    group: {
      type: "number",
    },
    replacement: {
      type: "string",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "regex",
          },
        },
      },
      then: {
        required: ["kind", "pattern"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "replace",
          },
        },
      },
      then: {
        required: ["kind", "pattern", "replacement"],
      },
    },
  ],
} as const;

const fillReadSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["text", "attr"],
    },
    name: {
      type: "string",
    },
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "attr",
          },
        },
      },
      then: {
        required: ["kind", "name"],
      },
    },
  ],
} as const;

const fillExtractSchema = {
  type: "object",
  additionalProperties: false,
  // `selector` is required only for the (default) selector source; a `meta` source uses `metaKey`
  // instead, so neither is unconditionally required here — the client normalizer drops a rule that
  // has neither.
  properties: {
    source: {
      type: "string",
      enum: ["selector", "meta"],
    },
    selector: {
      type: "string",
    },
    metaKey: {
      type: "string",
    },
    filters: {
      type: "array",
      items: fillFilterSchema,
    },
    read: fillReadSchema,
    transform: {
      type: "array",
      items: fillTransformSchema,
    },
    split: {
      type: "string",
    },
  },
} as const;

const fillTargetSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
      enum: ["field", "customProperty", "taxonomy", "image", "taxonomyEntity", "taxonomyDirect", "publisher", "sections"],
    },
    field: {
      type: "string",
      // `field` is reused by the `field` (bookmark scalar), `taxonomyEntity`, and `taxonomyDirect`
      // targets; the per-kind `if/then` below picks which enum applies via a nested `field` schema.
    },
    // `taxonomyDirect` target: how the entity is resolved from the page. `select` (match mode) is a
    // full extract sub-schema; declared here because the body is `additionalProperties: false`.
    resolve: {
      type: "object",
      additionalProperties: false,
      required: ["mode"],
      properties: {
        mode: {
          type: "string",
          enum: ["url", "match"],
        },
        select: fillExtractSchema,
      },
      allOf: [
        {
          if: {
            properties: {
              mode: {
                const: "match",
              },
            },
          },
          then: {
            required: ["mode", "select"],
          },
        },
      ],
    },
    propertyId: {
      type: "string",
      format: "uuid",
    },
    subField: {
      type: "string",
      enum: ["current", "total"],
    },
    choiceValue: {
      type: "string",
    },
    taxonomy: {
      type: "string",
      enum: ["people", "groups", "locations", "tags"],
    },
    setMain: {
      type: "boolean",
    },
    association: {
      type: "string",
      enum: [...TAXONOMY_ENTITY_ASSOCIATIONS],
    },
    socialPlatform: {
      type: "string",
      enum: SOCIAL_MEDIA_PLATFORMS,
    },
    // `sections` target: entry type + optional relative sub-selectors for the tiered / named build.
    entryType: {
      type: "string",
      enum: ["url", "page", "timestamp"],
    },
    container: {
      type: "string",
    },
    header: {
      type: "string",
    },
    itemName: {
      type: "string",
    },
    itemUrl: {
      type: "string",
    },
    // `sections` target: text-content classifier grouping a flat item list into sections/subsections.
    sectionMatch: textMatchSchema,
  },
  allOf: [
    {
      if: {
        properties: {
          kind: {
            const: "field",
          },
        },
      },
      then: {
        required: ["kind", "field"],
        properties: {
          field: {
            enum: ["title", "description", "isbn", "year"],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "customProperty",
          },
        },
      },
      then: {
        required: ["kind", "propertyId"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomy",
          },
        },
      },
      then: {
        required: ["kind", "taxonomy"],
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomyEntity",
          },
        },
      },
      then: {
        required: ["kind", "association", "field"],
        properties: {
          field: {
            // Scalar fields + `relation:<key>` relations + `language` (see TAXONOMY_ENTITY_WRITE_KEYS).
            enum: [...TAXONOMY_ENTITY_WRITE_KEYS],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "taxonomyDirect",
          },
        },
      },
      then: {
        required: ["kind", "association", "resolve", "field"],
        properties: {
          field: {
            // `image` is fillable here (multipart endpoint) but not in the JSON `taxonomyEntity` set.
            enum: [...TAXONOMY_ENTITY_FIELDS, "image"],
          },
        },
      },
    },
    {
      if: {
        properties: {
          kind: {
            const: "sections",
          },
        },
      },
      then: {
        required: ["kind", "propertyId", "entryType"],
      },
    },
  ],
} as const;

const pathMatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "value"],
  properties: {
    mode: {
      type: "string",
      enum: ["prefix", "contains", "suffix", "regex"],
    },
    value: {
      type: "string",
    },
  },
} as const;

const extensionFillRulesSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["id", "label", "target", "extract"],
    properties: {
      id: {
        type: "string",
      },
      label: {
        type: "string",
      },
      pathMatch: pathMatchSchema,
      target: fillTargetSchema,
      extract: fillExtractSchema,
    },
  },
} as const;

const scanObservationsSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["kind", "source"],
    properties: {
      kind: {
        type: "string",
        enum: [...WEBSITE_SCAN_OBSERVATION_KINDS],
      },
      detail: {
        type: "string",
      },
      source: {
        type: "string",
        enum: ["scanner", "manual"],
      },
      updatedAt: {
        type: "string",
      },
    },
  },
} as const;

const socialLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["platform", "url"],
    additionalProperties: false,
    properties: {
      platform: {
        type: "string",
        enum: SOCIAL_MEDIA_PLATFORMS,
      },
      url: {
        type: "string",
        minLength: 1,
      },
    },
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
    description: {
      type: ["string", "null"],
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
    mediaTypeId: {
      type: ["string", "null"],
      format: "uuid",
    },
    socialLinks: socialLinksSchema,
    labeledWebsites: labeledWebsitesSchema,
    youtubeChannelIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    alternateNames: alternateNamesSchema,
    extensionFillRules: extensionFillRulesSchema,
    scanObservations: scanObservationsSchema,
    redirectResolutionFailure: {
      type: "boolean",
    },
    scanUrlForIsbn: {
      type: "boolean",
    },
  },
} as const;

const idArray = {
  type: "array",
  items: {
    type: "string",
    format: "uuid",
  },
} as const;

const bulkUpdateBody = {
  type: "object",
  required: ["ids", "patch"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    patch: updateWebsiteBody,
  },
} as const;

const bulkTagsBody = {
  type: "object",
  required: ["ids", "tagIds", "op"],
  additionalProperties: false,
  properties: {
    ids: idArray,
    tagIds: idArray,
    op: {
      type: "string",
      enum: ["add", "remove"],
    },
  },
} as const;

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
