import type { FastifyInstance } from "fastify";
import type {
  CreateDisplayPresetInput,
  UpdateDisplayPresetInput,
} from "@eesimple/types";
import {
  createDisplayPreset,
  deleteDisplayPreset,
  listDisplayPresets,
  updateDisplayPreset,
} from "@/services/displayPresets";

const displayPresetParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const settingsSchema = {
  type: "object",
  required: ["columns", "imageVisibility", "imageMode", "imageLayout"],
  additionalProperties: false,
  properties: {
    columns: {
      type: "number",
    },
    imageVisibility: {
      type: "string",
      enum: ["shown", "image-only", "off"],
    },
    imageMode: {
      type: "string",
    },
    imageLayout: {
      type: "string",
      enum: ["above", "side"],
    },
    hiddenFields: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
} as const;

const createBody = {
  type: "object",
  required: ["name", "settings"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    settings: settingsSchema,
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
    settings: settingsSchema,
  },
} as const;

export async function displayPresetRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/display-presets",
    {
      schema: {
        tags: ["display-presets"],
        summary: "List all display presets",
      },
    },
    async () => listDisplayPresets(),
  );

  app.post<{ Body: CreateDisplayPresetInput }>(
    "/api/display-presets",
    {
      schema: {
        tags: ["display-presets"],
        summary: "Create a display preset",
        body: createBody,
      },
    },
    async (request, reply) => {
      const preset = await createDisplayPreset(request.body);
      return reply.status(201).send(preset);
    },
  );

  app.patch<{ Params: { id: string };
    Body: UpdateDisplayPresetInput; }>(
    "/api/display-presets/:id",
    {
      schema: {
        tags: ["display-presets"],
        summary: "Update a display preset",
        params: displayPresetParams,
        body: updateBody,
      },
    },
    async (request, reply) => {
      const preset = await updateDisplayPreset(request.params.id, request.body);
      if (!preset) return reply.status(404).send({
        error: "Not Found",
        message: "Display preset not found",
        statusCode: 404,
      });
      return preset;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/display-presets/:id",
    {
      schema: {
        tags: ["display-presets"],
        summary: "Delete a display preset",
        params: displayPresetParams,
      },
    },
    async (request, reply) => {
      const deleted = await deleteDisplayPreset(request.params.id);
      if (!deleted) return reply.status(404).send({
        error: "Not Found",
        message: "Display preset not found",
        statusCode: 404,
      });
      return reply.status(204).send();
    },
  );
}
