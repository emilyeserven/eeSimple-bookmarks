import type { FastifyInstance } from "fastify";
import {
  fetchKavitaSeriesCover,
  fetchKavitaSeriesDetail,
  fetchKavitaToc,
  kavitaEnabledAsync,
  searchKavitaSeries,
} from "@/services/kavita";
import { processImage } from "@/utils/image";
import { AppError, NotFoundError, StorageUnconfiguredError } from "@/utils/errors";

const seriesQuery = {
  type: "object",
  required: ["q"],
  additionalProperties: false,
  properties: {
    q: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const seriesCoverParams = {
  type: "object",
  required: ["seriesId"],
  additionalProperties: false,
  properties: {
    seriesId: {
      type: "integer",
    },
  },
} as const;

const tocQuery = {
  type: "object",
  required: ["seriesId"],
  additionalProperties: false,
  properties: {
    seriesId: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

/**
 * Kavita lookups, mounted under `/api`. The middleware proxies the operator's Kavita server so the
 * API key never reaches the client — responses carry only the mapped series DTOs.
 */
export async function kavitaRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/kavita/series", {
    schema: {
      tags: ["connectors"],
      querystring: seriesQuery,
    },
  }, async (req) => {
    if (!(await kavitaEnabledAsync())) {
      throw new StorageUnconfiguredError("Kavita is not configured");
    }
    const {
      q,
    } = req.query as { q: string };
    return searchKavitaSeries(q);
  });

  // Current live name/release year for a linked series — used to flag drift between Kavita and the
  // local Book's own fields. Read-only, like every other route here.
  app.get("/api/kavita/series/:seriesId", {
    schema: {
      tags: ["connectors"],
      params: seriesCoverParams,
    },
  }, async (req) => {
    if (!(await kavitaEnabledAsync())) {
      throw new StorageUnconfiguredError("Kavita is not configured");
    }
    const {
      seriesId,
    } = req.params as { seriesId: number };
    const outcome = await fetchKavitaSeriesDetail(seriesId);
    if (outcome.status === "not_found") {
      throw new NotFoundError("Series", "Series not found on Kavita");
    }
    if (outcome.status === "unavailable") {
      throw new AppError("Could not read series details from Kavita", "internal", 502);
    }
    return outcome.result;
  });

  // Proxy a series' cover image bytes so the client never needs the Kavita API key. Used for the
  // manual series picker preview and the ISBN-fallback result's coverUrl.
  app.get("/api/kavita/series/:seriesId/cover", {
    schema: {
      tags: ["connectors"],
      params: seriesCoverParams,
    },
  }, async (req, reply) => {
    if (!(await kavitaEnabledAsync())) {
      throw new StorageUnconfiguredError("Kavita is not configured");
    }
    const {
      seriesId,
    } = req.params as { seriesId: number };
    const bytes = await fetchKavitaSeriesCover(seriesId);
    if (!bytes) {
      throw new NotFoundError("Cover", "No cover available");
    }
    const processed = await processImage(bytes);
    if ("error" in processed) {
      throw new NotFoundError("Cover", "No cover available");
    }
    reply.header("Content-Type", processed.contentType);
    reply.header("Cache-Control", "public, max-age=3600");
    return reply.send(processed.body);
  });

  // Table of contents for a series' book file. EPUB via Kavita's book API; PDF by downloading the
  // file and parsing its embedded outline server-side. `entries: []` = the book has no ToC.
  app.get("/api/kavita/toc", {
    schema: {
      tags: ["connectors"],
      querystring: tocQuery,
    },
  }, async (req) => {
    if (!(await kavitaEnabledAsync())) {
      throw new StorageUnconfiguredError("Kavita is not configured");
    }
    const {
      seriesId,
    } = req.query as { seriesId: number };
    const outcome = await fetchKavitaToc(seriesId);
    if (outcome.status === "no_chapter") {
      throw new NotFoundError("File", "No EPUB or PDF file found for this series");
    }
    if (outcome.status === "unavailable") {
      throw new AppError("Could not read the table of contents from Kavita", "internal", 502);
    }
    return outcome.result;
  });
}
