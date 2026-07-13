import type { FastifyInstance } from "fastify";
import type { CreatePinnedSidebarItemInput, UpdatePinnedSidebarItemInput } from "@eesimple/types";

import {
  createPinnedSidebarItem,
  deletePinnedSidebarItem,
  listPinnedSidebarItems,
  reorderPinnedSidebarItems,
  updatePinnedSidebarItem,
} from "@/services/pinnedSidebarItems";
import { NotFoundError } from "@/utils/errors";

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
      enum: ["category", "tag", "website", "media-type", "youtube-channel", "saved-filter", "location", "taxonomy-listing"],
    },
    entityId: {
      type: "string",
    },
    sectionId: {
      type: ["string", "null"],
      format: "uuid",
    },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    sectionId: {
      type: ["string", "null"],
      format: "uuid",
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const reorderBody = {
  type: "object",
  required: ["orderedIds"],
  additionalProperties: false,
  properties: {
    orderedIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
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

  app.put<{ Body: { orderedIds: string[] } }>(
    "/api/pinned-sidebar-items/reorder",
    {
      schema: {
        tags: ["pinned-sidebar-items"],
        summary: "Reorder pinned sidebar items",
        body: reorderBody,
      },
    },
    async (request, reply) => {
      await reorderPinnedSidebarItems(request.body.orderedIds);
      return reply.status(204).send();
    },
  );

  app.patch<{ Params: { id: string };
    Body: UpdatePinnedSidebarItemInput; }>(
    "/api/pinned-sidebar-items/:id",
    {
      schema: {
        tags: ["pinned-sidebar-items"],
        summary: "Reassign a pinned item's section / order",
        params: idParams,
        body: updateBody,
      },
    },
    async (request, reply) => {
      const item = await updatePinnedSidebarItem(request.params.id, request.body);
      if (!item) {
        throw new NotFoundError("Pinned item");
      }
      return item;
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
        throw new NotFoundError("Pinned item");
      }
      return reply.status(204).send();
    },
  );
}
