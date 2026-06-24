import type { BulkDeleteResult } from "@eesimple/types";
import type { FastifyInstance } from "fastify";

const bulkDeleteBody = {
  type: "object",
  required: ["ids"],
  additionalProperties: false,
  properties: {
    ids: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/**
 * Register `POST <basePath>/bulk-delete` for a taxonomy listing. The body is `{ ids: uuid[] }` and the
 * response is the per-item `BulkDeleteResult[]` from the entity's `bulkDelete<Entity>` service, which
 * preserves each entity's built-in guards and cascades. Shared so every listing exposes the endpoint
 * identically rather than re-declaring the schema + handler per route file.
 */
export function registerBulkDelete(
  app: FastifyInstance,
  basePath: string,
  tag: string,
  bulkDelete: (ids: string[]) => Promise<BulkDeleteResult[]>,
): void {
  app.post(`${basePath}/bulk-delete`, {
    schema: {
      tags: [tag],
      body: bulkDeleteBody,
    },
  }, async (req) => {
    const {
      ids,
    } = req.body as { ids: string[] };
    return bulkDelete(ids);
  });
}
