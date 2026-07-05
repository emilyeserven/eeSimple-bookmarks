import type { TaxonomyImageOwnerType } from "@eesimple/types";
import type { FastifyInstance } from "fastify";
import {
  addTaxonomyImage,
  getTaxonomyImageRow,
  listTaxonomyImageRows,
  removeTaxonomyImage,
  setMainTaxonomyImage,
  taxonomyImageFromRow,
  type AddTaxonomyImageResult,
} from "@/services/taxonomyImages";
import { getObjectStream, isObjectStoreConfigured } from "@/utils/objectStore";
import {
  ImageTooLargeError,
  MaxImagesReachedError,
  NoFileUploadedError,
  NotFoundError,
  StorageUnconfiguredError,
  UnsupportedImageError,
} from "@/utils/errors";

const ownerParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const ownerImageParams = {
  type: "object",
  required: ["id", "imageId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    imageId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

/** Throw the coded error for a common `addTaxonomyImage` failure outcome; a no-op on success. */
function assertAddOutcomeOk(result: AddTaxonomyImageResult | "not_found"): void {
  if (result === "not_found") throw new NotFoundError("Item", "Not found");
  if (result === "too_many") throw new MaxImagesReachedError();
  if (result === "bad_image") throw new UnsupportedImageError();
}

/** One "pull an image from an external source" action registered alongside the CRUD image routes. */
export interface TaxonomyImageAutoFetchAction {
  /** Path segment mounted at `${basePath}/:id/images/${path}`, e.g. `"plex-poster"`. */
  path: string;
  /** Runs the fetch-and-store; returns the new image, or a failure outcome. */
  run: (ownerId: string) => Promise<AddTaxonomyImageResult | "not_found" | string>;
  /** Maps this action's source-specific failure strings (beyond the common outcomes) to a response. */
  errorMessages: Record<string, string>;
}

/**
 * Register the shared image-gallery CRUD (list/serve/upload/set-main/delete) plus any auto-fetch
 * actions for one Plex/Kavita-backed media taxonomy, mounted under `${basePath}/:id/images`. Mirrors
 * the bookmark image routes in `routes/bookmarks.ts`, but delegates to the generic
 * `services/taxonomyImages.ts` with a fixed `ownerType` instead of the bookmark-specific service.
 */
export function registerTaxonomyImageRoutes(
  app: FastifyInstance,
  basePath: string,
  ownerType: TaxonomyImageOwnerType,
  tag: string,
  autoFetchActions: TaxonomyImageAutoFetchAction[] = [],
): void {
  app.get(`${basePath}/:id/images`, {
    schema: {
      tags: [tag],
      params: ownerParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const rows = await listTaxonomyImageRows(ownerType, id);
    return rows.map(taxonomyImageFromRow);
  });

  // Add an image (multipart), keeping the entity's other images.
  app.post(`${basePath}/:id/images`, {
    schema: {
      tags: [tag],
      params: ownerParams,
      querystring: {
        type: "object",
        additionalProperties: false,
        properties: {
          main: {
            type: "boolean",
          },
        },
      },
      consumes: ["multipart/form-data"],
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      main,
    } = req.query as { main?: boolean };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    let bytes: Buffer;
    try {
      const file = await req.file();
      if (!file) throw new NoFileUploadedError();
      bytes = await file.toBuffer();
    }
    catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await addTaxonomyImage(ownerType, id, bytes, "upload", {
      setMain: main === true,
    });
    assertAddOutcomeOk(result);
    return reply.code(201).send(result);
  });

  // Make one of the entity's images the main image.
  app.post(`${basePath}/:id/images/:imageId/main`, {
    schema: {
      tags: [tag],
      params: ownerImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const result = await setMainTaxonomyImage(ownerType, id, imageId);
    if (result === "not_found") throw new NotFoundError("Image");
    return reply.code(200).send(result);
  });

  // Remove one image.
  app.delete(`${basePath}/:id/images/:imageId`, {
    schema: {
      tags: [tag],
      params: ownerImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const removed = await removeTaxonomyImage(ownerType, id, imageId);
    if (!removed) throw new NotFoundError("Image", "No image to delete");
    return reply.code(204).send();
  });

  for (const action of autoFetchActions) {
    app.post(`${basePath}/:id/images/${action.path}`, {
      schema: {
        tags: [tag],
        params: ownerParams,
      },
    }, async (req, reply) => {
      const {
        id,
      } = req.params as { id: string };
      if (!isObjectStoreConfigured()) {
        throw new StorageUnconfiguredError();
      }
      const result = await action.run(id);
      assertAddOutcomeOk(result as AddTaxonomyImageResult | "not_found");
      if (typeof result === "string") {
        return reply.code(422).send({
          message: action.errorMessages[result] ?? "Could not import the image",
        });
      }
      return reply.code(201).send(result);
    });
  }
}

/**
 * Register the single shared byte-serving route for every taxonomy image, `GET
 * /api/taxonomy-images/:imageId` — not scoped by owner id in the path since the id itself is a
 * stable, unguessable UUID. Call this exactly ONCE from `app.ts` (unlike
 * {@link registerTaxonomyImageRoutes}, which is called once per entity) — Fastify rejects a route
 * path registered twice.
 */
export function registerTaxonomyImageServingRoute(app: FastifyInstance): void {
  app.get("/api/taxonomy-images/:imageId", {
    schema: {
      tags: ["images"],
      params: {
        type: "object",
        required: ["imageId"],
        properties: {
          imageId: {
            type: "string",
            format: "uuid",
          },
        },
      },
    },
  }, async (req, reply) => {
    const {
      imageId,
    } = req.params as { imageId: string };
    const row = await getTaxonomyImageRow(imageId);
    if (!row) throw new NotFoundError("Image", "No image");
    const object = await getObjectStream(row.objectKey);
    if (!object) throw new NotFoundError("Image", "No image");
    reply.header("Content-Type", row.contentType);
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(object.body);
  });
}
