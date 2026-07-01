import type { FastifyInstance } from "fastify";
import { kavitaEnabledAsync, searchKavitaSeries } from "@/services/kavita";

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
}
