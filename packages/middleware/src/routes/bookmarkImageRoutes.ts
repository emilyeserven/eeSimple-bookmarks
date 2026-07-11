import type { FastifyInstance } from "fastify";
import {
  addBookmarkImage,
  fetchAndStoreOgImage,
  removeBookmarkImage,
  removeBookmarkImageById,
  removeBookmarkScreenshot,
  setBookmarkImage,
  setMainImage,
  storeBookmarkImagesFromCandidates,
  storeUploadedScreenshot,
  takeAndStoreScreenshot,
} from "@/services/bookmarkImages";
import { queueReelArchive, removeBookmarkReelArchive } from "@/services/reelArchive";
import { importIsbnCover } from "@/services/isbn";
import { importKavitaSeriesCover, kavitaEnabledAsync } from "@/services/kavita";
import { importBookmarkPodcastArtwork, resolveBookmarkPodcastFeedPreview } from "@/services/podcastFeed";
import { importPlexPoster, plexEnabledAsync, resolveBookmarkPlexMetadata } from "@/services/plex";
import { isObjectStoreConfigured } from "@/utils/objectStore";
import { AppError, ImageTooLargeError, MaxImagesReachedError, NoFileUploadedError, NotFoundError, StorageUnconfiguredError, ValidationError } from "@/utils/errors";
import { bookmarkImageParams, bookmarkParams } from "./bookmarkParamsSchema";

/** Bookmark image upload, auto-capture, and removal. */
export function registerBookmarkImageRoutes(app: FastifyInstance): void {
  // Upload an image for a bookmark (multipart). Replaces any existing image.
  app.post("/api/bookmarks/:id/image", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
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
    const result = await setBookmarkImage(id, bytes, "upload");
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Auto-capture: fetch the bookmark page's preview image (og:image) and store it.
  app.post("/api/bookmarks/:id/image/auto", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = await fetchAndStoreOgImage(id);
    const success = typeof result !== "string";
    req.log[success ? "info" : "warn"](
      {
        bookmarkId: id,
        result: success ? "stored" : result,
      },
      success ? "[image-auto] auto-capture succeeded" : "[image-auto] auto-capture failed",
    );
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (typeof result === "string") {
      const errorMessages: Record<string, string> = {
        no_image: "No preview image found for that page",
        bad_image: "Preview image couldn't be loaded",
        blocked: "Access to this page was blocked",
        server_error: "Site returned a server error",
        fetch_error: "Page couldn't be reached",
      };
      return reply.code(502).send({
        message: errorMessages[result] ?? "Could not fetch a preview image",
        code: result,
      });
    }
    return reply.code(201).send(result);
  });

  // Import the linked Kavita series' cover as the bookmark's main image (keeps other images).
  app.post("/api/bookmarks/:id/kavita-cover", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    if (!(await kavitaEnabledAsync())) {
      throw new StorageUnconfiguredError("Kavita is not configured");
    }
    const result = await importKavitaSeriesCover(id);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "not_linked") {
      throw new ValidationError("Bookmark is not linked to a Kavita series");
    }
    if (result === "cover_unavailable") {
      throw new AppError("Could not fetch the cover from Kavita", "internal", 502);
    }
    if (result === "too_many") {
      throw new MaxImagesReachedError();
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Import the linked Plex item's poster as the bookmark's main image (keeps other images).
  app.post("/api/bookmarks/:id/plex-poster", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    if (!(await plexEnabledAsync())) {
      throw new StorageUnconfiguredError("Plex is not configured");
    }
    const result = await importPlexPoster(id);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "not_linked") {
      throw new ValidationError("Bookmark is not linked to a Plex item");
    }
    if (result === "poster_unavailable") {
      throw new AppError("Could not fetch the poster from Plex", "internal", 502);
    }
    if (result === "too_many") {
      throw new MaxImagesReachedError();
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Import the cover from the bookmark's stored ISBN/ASIN as its main image (keeps other images).
  app.post("/api/bookmarks/:id/isbn-cover", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = await importIsbnCover(id);
    if (result === "no_isbn") {
      throw new ValidationError("Bookmark has no ISBN/ASIN set");
    }
    if (result === "isbn_not_found") {
      throw new NotFoundError("Book", "No book found for that ISBN/ASIN");
    }
    if (result === "cover_unavailable") {
      throw new AppError("Could not fetch a cover image for that ISBN/ASIN", "internal", 502);
    }
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "too_many") {
      throw new MaxImagesReachedError();
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Resolve the bookmark's own promoted Plex identity's current Wikidata metadata (native/English
  // name, Wikipedia links) for the "Sync from source" review — never writes. See
  // `resolveBookmarkPlexMetadata` for the bookmark counterpart of the taxonomy `plex-metadata-preview`
  // route.
  app.get("/api/bookmarks/:id/plex-metadata-preview", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!(await plexEnabledAsync())) {
      throw new StorageUnconfiguredError("Plex is not configured");
    }
    const result = await resolveBookmarkPlexMetadata(id);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "not_linked") {
      throw new ValidationError("Bookmark is not linked to a Plex item");
    }
    return reply.code(200).send(result);
  });

  // Resolve the bookmark's own promoted podcast feed identity's current metadata (name/author/
  // description/artwork/provider links) for the "Sync from source" review — never writes. See
  // `resolveBookmarkPodcastFeedPreview` for the bookmark counterpart of the Podcasts taxonomy's
  // `feed-preview` route.
  app.get("/api/bookmarks/:id/feed-preview", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const result = await resolveBookmarkPodcastFeedPreview(id);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === null) {
      throw new ValidationError("Bookmark has no usable podcast feed source");
    }
    return reply.code(200).send(result);
  });

  // Import the bookmark's own promoted podcast identity's artwork as its main image (keeps other
  // images). The bookmark counterpart of the Podcasts taxonomy's artwork import.
  app.post("/api/bookmarks/:id/podcast-artwork", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = await importBookmarkPodcastArtwork(id);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "no_source") {
      throw new ValidationError("Bookmark has no podcast feed or iTunes id set");
    }
    if (result === "artwork_unavailable") {
      throw new AppError("Could not fetch artwork for that podcast", "internal", 502);
    }
    if (result === "too_many") {
      throw new MaxImagesReachedError();
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Remove a bookmark's image.
  app.delete("/api/bookmarks/:id/image", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkImage(id);
    if (!removed) {
      throw new NotFoundError("Image", "No image to delete");
    }
    return reply.code(204).send();
  });

  registerBookmarkGalleryRoutes(app);
}

/** Bookmark multi-image gallery, screenshot, and reel-archive routes. */
function registerBookmarkGalleryRoutes(app: FastifyInstance): void {
  // Add an image to a bookmark (multipart), keeping its other images. The first image (or one sent
  // with `?main=1`) becomes the main image.
  app.post("/api/bookmarks/:id/images", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
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
      if (!file) {
        throw new NoFileUploadedError();
      }
      bytes = await file.toBuffer();
    }
    catch (err) {
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await addBookmarkImage(id, bytes, "upload", {
      setMain: main === true,
    });
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "too_many") {
      throw new MaxImagesReachedError();
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Capture images chosen from a URL scan. SSRF-safe: the server re-derives the page's allowed
  // candidates from the bookmark's own stored URL and only stores the requested ones.
  app.post("/api/bookmarks/:id/images/from-candidates", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      body: {
        type: "object",
        required: ["urls"],
        additionalProperties: false,
        properties: {
          urls: {
            type: "array",
            items: {
              type: "string",
              format: "uri",
            },
          },
          mainUrl: {
            type: "string",
            format: "uri",
            nullable: true,
          },
        },
      } as const,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      urls, mainUrl,
    } = req.body as { urls: string[];
      mainUrl?: string | null; };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const result = await storeBookmarkImagesFromCandidates(id, urls, mainUrl ?? null);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    return reply.code(201).send(result);
  });

  // Make one of a bookmark's images its main/primary image.
  app.post("/api/bookmarks/:id/images/:imageId/main", {
    schema: {
      tags: ["images"],
      params: bookmarkImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const result = await setMainImage(id, imageId);
    if (result === "not_found") {
      throw new NotFoundError("Image");
    }
    return reply.code(200).send(result);
  });

  // Remove one of a bookmark's images.
  app.delete("/api/bookmarks/:id/images/:imageId", {
    schema: {
      tags: ["images"],
      params: bookmarkImageParams,
    },
  }, async (req, reply) => {
    const {
      id, imageId,
    } = req.params as { id: string;
      imageId: string; };
    const removed = await removeBookmarkImageById(id, imageId);
    if (!removed) {
      throw new NotFoundError("Image", "No image to delete");
    }
    return reply.code(204).send();
  });

  // Take an on-demand Browserless screenshot and store it.
  app.post("/api/bookmarks/:id/screenshot", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
      body: {
        type: "object",
        properties: {
          delayMs: {
            type: "integer",
            minimum: 0,
            maximum: 30000,
          },
          width: {
            type: "integer",
            minimum: 200,
            maximum: 3840,
          },
          height: {
            type: "integer",
            minimum: 200,
            maximum: 2160,
          },
          scrollDistance: {
            type: "integer",
            minimum: 0,
            maximum: 10000,
          },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      delayMs, width, height, scrollDistance,
    } = (req.body ?? {}) as { delayMs?: number;
      width?: number;
      height?: number;
      scrollDistance?: number; };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const viewport = width != null && height != null
      ? {
        width,
        height,
      }
      : undefined;
    const result = await takeAndStoreScreenshot(id, delayMs, viewport, scrollDistance);
    if (result === "not_found") throw new NotFoundError("Bookmark");
    if (result === "not_configured") throw new StorageUnconfiguredError("No screenshot provider configured");
    if (result === "bad_image") throw new AppError("Screenshot could not be captured", "internal", 502);
    return reply.code(201).send(result);
  });

  // Store a screenshot captured client-side by the browser extension (multipart). Unlike the
  // Browserless capture above, this accepts uploaded bytes, so it works on pages behind a login the
  // server can't reach. Replaces any existing screenshot.
  app.post("/api/bookmarks/:id/screenshot/upload", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
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
      if ((err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE") {
        throw new ImageTooLargeError();
      }
      throw err;
    }
    const result = await storeUploadedScreenshot(id, bytes);
    if (result === "not_found") {
      throw new NotFoundError("Bookmark");
    }
    if (result === "bad_image") {
      throw new AppError("Unsupported or invalid image", "unsupportedImage", 415);
    }
    return reply.code(201).send(result);
  });

  // Remove a bookmark's screenshot.
  app.delete("/api/bookmarks/:id/screenshot", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkScreenshot(id);
    if (!removed) throw new NotFoundError("Screenshot", "No screenshot to delete");
    return reply.code(204).send();
  });

  // Queue a background job to archive a bookmark's Instagram reel video into object storage. Returns
  // immediately (202) with the queued job; progress surfaces in the header indicator and a toast
  // fires on completion (mirrors how imports run). The worker captures and records its own outcome.
  app.post("/api/bookmarks/:id/reel-archive", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!isObjectStoreConfigured()) {
      throw new StorageUnconfiguredError();
    }
    const job = await queueReelArchive(id);
    return reply.code(202).send(job);
  });

  // Remove a bookmark's archived reel.
  app.delete("/api/bookmarks/:id/reel-archive", {
    schema: {
      tags: ["images"],
      params: bookmarkParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeBookmarkReelArchive(id);
    if (!removed) throw new NotFoundError("Reel archive", "No reel archive to delete");
    return reply.code(204).send();
  });
}
