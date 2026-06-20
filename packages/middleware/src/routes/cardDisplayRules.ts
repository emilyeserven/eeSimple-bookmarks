import type { FastifyInstance } from "fastify";
import type {
  CreateCardDisplayRuleInput,
  UpdateCardDisplayRuleInput,
} from "@eesimple/types";
import {
  createCardDisplayRule,
  deleteCardDisplayRule,
  listCardDisplayRules,
  reorderCardDisplayRules,
  updateCardDisplayRule,
} from "@/services/cardDisplayRules";

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

const displayProperties = {
  description: {
    type: "string",
    nullable: true,
  },
  sortOrder: {
    type: "integer",
  },
  hiddenCardFields: {
    type: "array",
    nullable: true,
    items: {
      type: "string",
    },
  },
  imageMode: {
    type: "string",
    nullable: true,
  },
  imageVisibility: {
    type: "string",
    nullable: true,
    enum: ["shown", "image-only", "off"],
  },
  imageLayout: {
    type: "string",
    nullable: true,
    enum: ["above", "side"],
  },
  cornerOverlays: {
    type: "boolean",
    nullable: true,
  },
} as const;

const createBody = {
  type: "object",
  required: ["name", "conditions"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    conditions: {
      $ref: "conditionTree#",
    },
    ...displayProperties,
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
    },
    conditions: {
      $ref: "conditionTree#",
    },
    ...displayProperties,
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

/** CRUD + reorder for card display rules. */
export async function cardDisplayRulesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/card-display-rules", {
    schema: {
      tags: ["card-display-rules"],
    },
  }, async () => listCardDisplayRules());

  // Static sub-paths must be declared before /:id to avoid Fastify treating them as UUID params.
  app.put("/api/card-display-rules/reorder", {
    schema: {
      tags: ["card-display-rules"],
      body: reorderBody,
    },
  }, async (req, reply) => {
    const {
      orderedIds,
    } = req.body as { orderedIds: string[] };
    await reorderCardDisplayRules(orderedIds);
    reply.status(204);
  });

  app.post("/api/card-display-rules", {
    schema: {
      tags: ["card-display-rules"],
      body: createBody,
    },
  }, async (req, reply) => {
    const input = req.body as CreateCardDisplayRuleInput;
    const rule = await createCardDisplayRule(input);
    reply.status(201);
    return rule;
  });

  app.patch("/api/card-display-rules/:id", {
    schema: {
      tags: ["card-display-rules"],
      params: ruleParams,
      body: updateBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const input = req.body as UpdateCardDisplayRuleInput;
    const rule = await updateCardDisplayRule(id, input);
    if (!rule) {
      reply.status(404);
      return {
        error: "Not Found",
        message: "Card display rule not found",
        statusCode: 404,
      };
    }
    return rule;
  });

  app.delete("/api/card-display-rules/:id", {
    schema: {
      tags: ["card-display-rules"],
      params: ruleParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteCardDisplayRule(id);
    if (!deleted) {
      reply.status(400);
      return {
        error: "Bad Request",
        message: "The Default rule cannot be deleted",
        statusCode: 400,
      };
    }
    reply.status(204);
  });
}
