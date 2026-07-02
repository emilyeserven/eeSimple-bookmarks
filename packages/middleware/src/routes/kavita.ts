import type { FastifyInstance } from "fastify";
import { fetchKavitaSeriesCover, kavitaEnabledAsync, searchKavitaSeries } from "@/services/kavita";
import { processImage } from "@/utils/image";

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
  }, async (req, reply) => {
    if (!(await kavitaEnabledAsync())) {
      return reply.code(503).send({
        message: "Kavita is not configured",
      });
    }
    const {
      q,
    } = req.query as { q: string };
    return searchKavitaSeries(q);
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
      return reply.code(503).send({
        message: "Kavita is not configured",
      });
    }
    const {
      seriesId,
    } = req.params as { seriesId: number };
    const bytes = await fetchKavitaSeriesCover(seriesId);
    if (!bytes) {
      return reply.code(404).send({
        message: "No cover available",
      });
    }
    const processed = await processImage(bytes);
    if ("error" in processed) {
      return reply.code(404).send({
        message: "No cover available",
      });
    }
    reply.header("Content-Type", processed.contentType);
    reply.header("Cache-Control", "public, max-age=3600");
    return reply.send(processed.body);
  });
}
