import type { FastifyInstance } from "fastify";
import type {
  CreateParseTemplateInput,
  UpdateParseTemplateInput,
} from "@eesimple/types";
import { PARSE_TAGS } from "@eesimple/types";
import { NotFoundError } from "@/utils/errors";
import {
  createParseTemplate,
  deleteParseTemplate,
  listParseTemplates,
  updateParseTemplate,
} from "@/services/parseTemplates";

const parseTemplateParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const fallbackTagSchema = {
  type: "string",
  enum: [...PARSE_TAGS],
} as const;

const createBody = {
  type: "object",
  required: ["name", "delineator", "pattern"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    delineator: {
      type: "string",
    },
    pattern: {
      type: "string",
    },
    fallbackTag: fallbackTagSchema,
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
    delineator: {
      type: "string",
    },
    pattern: {
      type: "string",
    },
    fallbackTag: fallbackTagSchema,
  },
} as const;

export async function parseTemplatesRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/parse-templates",
    {
      schema: {
        tags: ["parse-templates"],
        summary: "List all parse templates",
      },
    },
    async () => listParseTemplates(),
  );

  app.post<{ Body: CreateParseTemplateInput }>(
    "/api/parse-templates",
    {
      schema: {
        tags: ["parse-templates"],
        summary: "Create a parse template",
        body: createBody,
      },
    },
    async (request, reply) => {
      const template = await createParseTemplate(request.body);
      return reply.status(201).send(template);
    },
  );

  app.patch<{ Params: { id: string };
    Body: UpdateParseTemplateInput; }>(
    "/api/parse-templates/:id",
    {
      schema: {
        tags: ["parse-templates"],
        summary: "Update a parse template",
        params: parseTemplateParams,
        body: updateBody,
      },
    },
    async (request, reply) => {
      const template = await updateParseTemplate(request.params.id, request.body);
      if (!template) throw new NotFoundError("Parse template");
      return template;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/parse-templates/:id",
    {
      schema: {
        tags: ["parse-templates"],
        summary: "Delete a parse template",
        params: parseTemplateParams,
      },
    },
    async (request, reply) => {
      const deleted = await deleteParseTemplate(request.params.id);
      if (!deleted) throw new NotFoundError("Parse template");
      return reply.status(204).send();
    },
  );
}
