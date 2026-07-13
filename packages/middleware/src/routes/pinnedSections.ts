import type { FastifyInstance } from "fastify";
import type { CreatePinnedSectionInput, UpdatePinnedSectionInput } from "@eesimple/types";

import {
  createPinnedSection,
  deletePinnedSection,
  listPinnedSections,
  reorderPinnedSections,
  updatePinnedSection,
} from "@/services/pinnedSections";
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
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
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

export async function pinnedSectionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/pinned-sections",
    {
      schema: {
        tags: ["pinned-sections"],
        summary: "List all pinned sections",
      },
    },
    () => listPinnedSections(),
  );

  app.post<{ Body: CreatePinnedSectionInput }>(
    "/api/pinned-sections",
    {
      schema: {
        tags: ["pinned-sections"],
        summary: "Create a pinned section",
        body: createBody,
      },
    },
    async (request, reply) => {
      const section = await createPinnedSection(request.body);
      return reply.status(201).send(section);
    },
  );

  app.put<{ Body: { orderedIds: string[] } }>(
    "/api/pinned-sections/reorder",
    {
      schema: {
        tags: ["pinned-sections"],
        summary: "Reorder pinned sections",
        body: reorderBody,
      },
    },
    async (request, reply) => {
      await reorderPinnedSections(request.body.orderedIds);
      return reply.status(204).send();
    },
  );

  app.patch<{ Params: { id: string };
    Body: UpdatePinnedSectionInput; }>(
    "/api/pinned-sections/:id",
    {
      schema: {
        tags: ["pinned-sections"],
        summary: "Rename / reorder a pinned section",
        params: idParams,
        body: updateBody,
      },
    },
    async (request, reply) => {
      const section = await updatePinnedSection(request.params.id, request.body);
      if (!section) {
        throw new NotFoundError("Pinned section");
      }
      return section;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/pinned-sections/:id",
    {
      schema: {
        tags: ["pinned-sections"],
        summary: "Delete a pinned section (its pins fall back to ungrouped)",
        params: idParams,
      },
    },
    async (request, reply) => {
      const deleted = await deletePinnedSection(request.params.id);
      if (!deleted) {
        throw new NotFoundError("Pinned section");
      }
      return reply.status(204).send();
    },
  );
}
