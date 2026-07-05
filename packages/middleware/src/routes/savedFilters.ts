import type { FastifyInstance } from "fastify";
import type {
  CreateSavedFilterInput,
  UpdateSavedFilterInput,
} from "@eesimple/types";
import { NotFoundError } from "@/utils/errors";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import {
  bulkDeleteSavedFilters,
  createSavedFilter,
  deleteSavedFilter,
  listSavedFilters,
  updateSavedFilter,
} from "@/services/savedFilters";

const savedFilterParams = {
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
  required: ["name", "filters"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    filters: {
      type: "object",
    },
    viewableOnline: {
      type: "boolean",
    },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    filters: {
      type: "object",
    },
    viewableOnline: {
      type: "boolean",
    },
  },
} as const;

export async function savedFilterRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/saved-filters", "saved-filters", bulkDeleteSavedFilters);

  app.get(
    "/api/saved-filters",
    {
      schema: {
        tags: ["saved-filters"],
        summary: "List all saved filters",
      },
    },
    async () => listSavedFilters(),
  );

  app.post<{ Body: CreateSavedFilterInput }>(
    "/api/saved-filters",
    {
      schema: {
        tags: ["saved-filters"],
        summary: "Create a saved filter",
        body: createBody,
      },
    },
    async (request, reply) => {
      const filter = await createSavedFilter(request.body);
      return reply.status(201).send(filter);
    },
  );

  app.patch<{ Params: { id: string };
    Body: UpdateSavedFilterInput; }>(
    "/api/saved-filters/:id",
    {
      schema: {
        tags: ["saved-filters"],
        summary: "Update a saved filter",
        params: savedFilterParams,
        body: updateBody,
      },
    },
    async (request, reply) => {
      const filter = await updateSavedFilter(request.params.id, request.body);
      if (!filter) throw new NotFoundError("Saved filter");
      return filter;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/saved-filters/:id",
    {
      schema: {
        tags: ["saved-filters"],
        summary: "Delete a saved filter",
        params: savedFilterParams,
      },
    },
    async (request, reply) => {
      const deleted = await deleteSavedFilter(request.params.id);
      if (!deleted) throw new NotFoundError("Saved filter");
      return reply.status(204).send();
    },
  );
}
