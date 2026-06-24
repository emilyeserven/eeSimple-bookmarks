import type { FastifyInstance } from "fastify";
import type { CreateCardFieldTemplateInput } from "@eesimple/types";
import {
  createCardFieldTemplate,
  deleteCardFieldTemplate,
  listCardFieldTemplates,
} from "@/services/cardFieldTemplates";
import { fieldZonesSchema } from "@/routes/cardFieldZonesSchema";

const templateParams = {
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
  required: ["name", "fieldZones"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    fieldZones: fieldZonesSchema,
  },
} as const;

export async function cardFieldTemplatesRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/card-field-templates",
    {
      schema: {
        tags: ["card-display-rules"],
        summary: "List all card field templates",
      },
    },
    async () => listCardFieldTemplates(),
  );

  app.post<{ Body: CreateCardFieldTemplateInput }>(
    "/api/card-field-templates",
    {
      schema: {
        tags: ["card-display-rules"],
        summary: "Create a card field template",
        body: createBody,
      },
    },
    async (request, reply) => {
      const template = await createCardFieldTemplate(request.body);
      return reply.status(201).send(template);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/api/card-field-templates/:id",
    {
      schema: {
        tags: ["card-display-rules"],
        summary: "Delete a card field template",
        params: templateParams,
      },
    },
    async (request, reply) => {
      const deleted = await deleteCardFieldTemplate(request.params.id);
      if (!deleted) return reply.status(404).send({
        error: "Not Found",
        message: "Card field template not found",
        statusCode: 404,
      });
      return reply.status(204).send();
    },
  );
}
