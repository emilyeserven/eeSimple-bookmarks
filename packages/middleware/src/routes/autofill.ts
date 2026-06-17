import type { FastifyInstance } from "fastify";
import type {
  CreateAutofillRuleInput,
  UpdateAutofillRuleInput,
} from "@eesimple/types";
import {
  createAutofillRule,
  deleteAutofillRule,
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
  required: ["name", "field", "operator", "pattern"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    field: {
      type: "string",
      enum: ["url", "title"],
    },
    operator: {
      type: "string",
      enum: ["contains", "starts_with", "regex", "domain"],
    },
    pattern: {
      type: "string",
      minLength: 1,
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

/** CRUD routes for autofill rules, mounted under `/api/autofill-rules`. */
export async function autofillRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/autofill-rules", {
    schema: {
      tags: ["autofill"],
    },
  }, async () => listAutofillRules());

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
