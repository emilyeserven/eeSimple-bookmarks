import type { FastifyInstance } from "fastify";
import type {
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";
import {
  createAutofillRule,
  deleteAutofillRule,
  getAutofillRuleBySlug,
  listAutofillRules,
  updateAutofillRule,
} from "@/services/autofill";

const ruleParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const numberValues = {
  type: "array",
  items: {
    type: "object",
    required: ["propertyId", "value"],
    additionalProperties: false,
    properties: {
      propertyId: {
        type: "string",
        format: "uuid",
      },
      value: {
        type: "number",
      },
    },
  },
} as const;

const booleanValues = {
  type: "array",
  items: {
    type: "object",
    required: ["propertyId", "value"],
    additionalProperties: false,
    properties: {
      propertyId: {
        type: "string",
        format: "uuid",
      },
      value: {
        type: "boolean",
      },
    },
  },
} as const;

const createRuleBody = {
  type: "object",
  required: ["name", "conditions"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    conditions: {
      $ref: "conditionTree#",
    },
    setCategoryId: {
      type: ["string", "null"],
      format: "uuid",
    },
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
    numberValues,
    booleanValues,
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const updateRuleBody = {
  type: "object",
  additionalProperties: false,
  properties: createRuleBody.properties,
} as const;

const slugParams = {
  type: "object",
  required: ["slug"],
  properties: {
    slug: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** CRUD routes for autofill rules, mounted under `/api/autofill-rules`. */
export async function autofillRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/autofill-rules", {
    schema: {
      tags: ["autofill"],
    },
  }, async () => listAutofillRules());

  app.get("/api/autofill-rules/by-slug/:slug", {
    schema: {
      tags: ["autofill"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const rule = await getAutofillRuleBySlug(slug);
    if (!rule) return reply.code(404).send({
      message: "Autofill rule not found",
    });
    return rule;
  });

  app.post("/api/autofill-rules", {
    schema: {
      tags: ["autofill"],
      body: createRuleBody,
    },
  }, async (req, reply) => {
    const rule = await createAutofillRule(req.body as CreateAutofillRuleInput);
    return reply.code(201).send(rule);
  });

  app.patch("/api/autofill-rules/:id", {
    schema: {
      tags: ["autofill"],
      params: ruleParams,
      body: updateRuleBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const rule = await updateAutofillRule(id, req.body as UpdateAutofillRuleInput);
    if (!rule) return reply.code(404).send({
      message: "Autofill rule not found",
    });
    return rule;
  });

  app.delete("/api/autofill-rules/:id", {
    schema: {
      tags: ["autofill"],
      params: ruleParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteAutofillRule(id);
    if (!deleted) return reply.code(404).send({
      message: "Autofill rule not found",
    });
    return reply.code(204).send();
  });
}
