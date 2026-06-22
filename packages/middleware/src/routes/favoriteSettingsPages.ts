import type { FastifyInstance } from "fastify";
import type { CreateFavoriteSettingsPageInput } from "@eesimple/types";

import {
  createFavoriteSettingsPage,
  deleteFavoriteSettingsPage,
  listFavoriteSettingsPages,
} from "@/services/favoriteSettingsPages";

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
  required: ["path"],
  additionalProperties: false,
  properties: {
    path: {
      type: "string",
    },
  },
} as const;

export async function favoriteSettingsPageRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/favorite-settings-pages",
    {
      schema: {
        tags: ["favorite-settings-pages"],
        summary: "List all favorited settings pages",
      },
    },
    () => listFavoriteSettingsPages(),
  );

  app.post<{ Body: CreateFavoriteSettingsPageInput }>(
    "/api/favorite-settings-pages",
    {
      schema: {
        tags: ["favorite-settings-pages"],
        summary: "Favorite a settings page",
        body: createBody,
      },
    },
    async (request, reply) => {
      const item = await createFavoriteSettingsPage(request.body);
      return reply.status(201).send(item);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/favorite-settings-pages/:id",
    {
      schema: {
        tags: ["favorite-settings-pages"],
        summary: "Un-favorite a settings page",
        params: idParams,
      },
    },
    async (request, reply) => {
      const deleted = await deleteFavoriteSettingsPage(request.params.id);
      if (!deleted) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Favorite settings page not found",
          statusCode: 404,
        });
      }
      return reply.status(204).send();
    },
  );
}
