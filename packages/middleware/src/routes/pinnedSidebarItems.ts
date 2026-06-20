import type { FastifyInstance } from "fastify";
import type { CreatePinnedSidebarItemInput } from "@eesimple/types";

import {
  createPinnedSidebarItem,
  deletePinnedSidebarItem,
  listPinnedSidebarItems,
} from "@/services/pinnedSidebarItems";

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
  required: ["entityType", "entityId"],
  additionalProperties: false,
  properties: {
    entityType: {
      type: "string",
      enum: ["category", "tag", "website", "media-type", "youtube-channel", "saved-filter"],
    },
    entityId: {
      type: "string",
    },
  },
} as const;

export async function pinnedSidebarItemRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/pinned-sidebar-items",
    {
      schema: {
        tags: ["pinned-sidebar-items"],
        summary: "List all pinned sidebar items",
      },
    },
    () => listPinnedSidebarItems(),
  );

  app.post<{ Body: CreatePinnedSidebarItemInput }>(
    "/api/pinned-sidebar-items",
    {
      schema: {
        tags: ["pinned-sidebar-items"],
        summary: "Pin an entity to the sidebar",
        body: createBody,
      },
    },
    async (request, reply) => {
      const item = await createPinnedSidebarItem(request.body);
      return reply.status(201).send(item);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/pinned-sidebar-items/:id",
    {
      schema: {
        tags: ["pinned-sidebar-items"],
        summary: "Unpin a sidebar item",
        params: idParams,
      },
    },
    async (request, reply) => {
      const deleted = await deletePinnedSidebarItem(request.params.id);
      if (!deleted) {
        return reply.status(404).send({
          error: "Not Found",
          message: "Pinned item not found",
          statusCode: 404,
        });
      }
      return reply.status(204).send();
    },
  );
}
