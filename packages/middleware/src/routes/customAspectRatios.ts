import type { FastifyInstance } from "fastify";
import type { CreateCustomAspectRatioInput } from "@eesimple/types";

import {
  createCustomAspectRatio,
  deleteCustomAspectRatio,
  listCustomAspectRatios,
} from "@/services/customAspectRatios";

const idParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createBody = {
  type: "object",
  required: ["name", "width", "height"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    width: {
      type: "integer",
      minimum: 1,
    },
    height: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

/** CRUD for user-defined named aspect ratios shown in the Aspect dropdown. */
export async function customAspectRatioRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/custom-aspect-ratios", async () => {
    return listCustomAspectRatios();
  });

  app.post<{ Body: CreateCustomAspectRatioInput }>(
    "/api/custom-aspect-ratios",
    {
      schema: {
        body: createBody,
      },
    },
    async (request, reply) => {
      const ratio = await createCustomAspectRatio(request.body);
      return reply.status(201).send(ratio);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/custom-aspect-ratios/:id",
    {
      schema: {
        params: idParams,
      },
    },
    async (request, reply) => {
      await deleteCustomAspectRatio(request.params.id);
      return reply.status(204).send();
    },
  );
}
