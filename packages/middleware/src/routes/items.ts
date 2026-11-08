import type { CreateItemInput, UpdateItemInput } from "@app/types";
import type { FastifyInstance } from "fastify";

import { createItem, deleteItem, getItem, listItems, updateItem } from "@/services/items";

// Module-level JSON-schema consts (see the `add-endpoint` skill). Bodies are
// `additionalProperties: false`, and Fastify's AJV `removeAdditional` SILENTLY strips any property
// not declared here — add a new field to the schema or it never reaches the service.
const itemSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
    },
    name: {
      type: "string",
    },
    slug: {
      type: "string",
    },
    description: {
      type: ["string", "null"],
    },
    createdAt: {
      type: "string",
    },
    updatedAt: {
      type: "string",
    },
  },
} as const;

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

const itemBodyProperties = {
  name: {
    type: "string",
    minLength: 1,
  },
  description: {
    type: ["string", "null"],
  },
} as const;

const createBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: itemBodyProperties,
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: itemBodyProperties,
} as const;

const tags = ["items"];

export async function itemRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/items", {
    schema: {
      tags,
      response: {
        200: {
          type: "array",
          items: itemSchema,
        },
      },
    },
  }, async () => listItems());

  app.get<{ Params: { id: string } }>("/api/items/:id", {
    schema: {
      tags,
      params: idParams,
      response: {
        200: itemSchema,
      },
    },
  }, async req => getItem(req.params.id));

  app.post<{ Body: CreateItemInput }>("/api/items", {
    schema: {
      tags,
      body: createBody,
      response: {
        201: itemSchema,
      },
    },
  }, async (req, reply) => reply.code(201).send(await createItem(req.body)));

  app.patch<{ Params: { id: string };
    Body: UpdateItemInput; }>("/api/items/:id", {
    schema: {
      tags,
      params: idParams,
      body: updateBody,
      response: {
        200: itemSchema,
      },
    },
  }, async req => updateItem(req.params.id, req.body));

  app.delete<{ Params: { id: string } }>("/api/items/:id", {
    schema: {
      tags,
      params: idParams,
    },
  }, async (req, reply) => {
    await deleteItem(req.params.id);
    return reply.code(204).send();
  });
}
