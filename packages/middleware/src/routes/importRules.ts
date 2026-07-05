import type { FastifyInstance } from "fastify";
import type {
  CreateImportRuleInput,
  UpdateImportRuleInput,
} from "@eesimple/types";
import {
  bulkDeleteImportRules,
  createImportRule,
  deleteImportRule,
  getImportRuleBySlug,
  listImportRules,
  updateImportRule,
} from "@/services/importRules";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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

const createRuleBody = {
  type: "object",
  required: ["name", "conditions", "action"],
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
    action: {
      type: "string",
      enum: ["approve", "reject", "block"],
    },
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

/** CRUD routes for import rules, mounted under `/api/import-rules`. */
export async function importRulesRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(
    app,
    "/api/import-rules",
    "import-rules",
    bulkDeleteImportRules,
  );

  app.get("/api/import-rules", {
    schema: {
      tags: ["import-rules"],
    },
  }, async () => listImportRules());

  app.get("/api/import-rules/by-slug/:slug", {
    schema: {
      tags: ["import-rules"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const rule = await getImportRuleBySlug(slug);
    if (!rule) throw new NotFoundError("Import rule");
    return rule;
  });

  app.post("/api/import-rules", {
    schema: {
      tags: ["import-rules"],
      body: createRuleBody,
    },
  }, async (req, reply) => {
    const rule = await createImportRule(req.body as CreateImportRuleInput);
    return reply.code(201).send(rule);
  });

  app.patch("/api/import-rules/:id", {
    schema: {
      tags: ["import-rules"],
      params: ruleParams,
      body: updateRuleBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const rule = await updateImportRule(id, req.body as UpdateImportRuleInput);
    if (!rule) throw new NotFoundError("Import rule");
    return rule;
  });

  app.delete("/api/import-rules/:id", {
    schema: {
      tags: ["import-rules"],
      params: ruleParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteImportRule(id);
    if (!deleted) throw new NotFoundError("Import rule");
    return reply.code(204).send();
  });
}
