import type { FastifyInstance } from "fastify";
import type { UpdateHomepageFilterInput } from "@eesimple/types";
import { getHomepageFilter, setHomepageFilter } from "@/services/homepageFilter";

const updateBody = {
  type: "object",
  required: ["conditions"],
  additionalProperties: false,
  properties: {
    conditions: {
      $ref: "conditionTree#",
    },
  },
} as const;

/** Read/replace the single global homepage filter, mounted under `/api/homepage-filter`. */
export async function homepageFilterRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/homepage-filter", {
    schema: {
      tags: ["homepage"],
    },
  }, async () => getHomepageFilter());

  app.put("/api/homepage-filter", {
    schema: {
      tags: ["homepage"],
      body: updateBody,
    },
  }, async (req) => {
    const {
      conditions,
    } = req.body as UpdateHomepageFilterInput;
    return setHomepageFilter(conditions);
  });
}
