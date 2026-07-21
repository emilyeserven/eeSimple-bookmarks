import type { FastifyInstance } from "fastify";
import type {
  CreateTagInput,
  TagReparentPlanInput,
  UpdateTagInput,
} from "@eesimple/types";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import {
  applyTagReparentPlan,
  bulkDeleteTags,
  bulkReparentTags,
  createTag,
  deleteTag,
  getTagTree,
  listTags,
  removeTagBookmarkAssociations,
  updateTag,
} from "@/services/tags";
import { NotFoundError } from "@/utils/errors";

const tagParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const deleteTagQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    reassignTo: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createTagBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    parentId: {
      type: ["string", "null"],
      format: "uuid",
    },
    description: {
      type: ["string", "null"],
    },
  },
} as const;

const updateTagBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...createTagBody.properties,
    editableOnCard: {
      type: "boolean",
    },
    excludeFromBackfill: {
      type: "boolean",
    },
    isFavorite: {
      type: "boolean",
    },
  },
} as const;

// `parentId` must be declared AND required here: the body is `additionalProperties: false`, so an
// undeclared field would be silently stripped by AJV's `removeAdditional` and read as `undefined`
// (which `updateTag` treats as "no change") — see the add-endpoint skill.
const bulkReparentBody = {
  type: "object",
  required: ["ids", "parentId"],
  additionalProperties: false,
  properties: {
    ids: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        format: "uuid",
      },
    },
    parentId: {
      type: ["string", "null"],
      format: "uuid",
    },
  },
} as const;

// Every nested field must be declared: the bodies are `additionalProperties: false`, so AJV's
// `removeAdditional` would silently strip any undeclared prop (see the add-endpoint skill). `parentId`
// carries no `format: "uuid"` — a move's parent may be a `tempId` (an arbitrary AI-coined string) or an
// existing id, and the service resolves/skips unknowns per-item rather than 400-ing the whole plan.
const reparentPlanBody = {
  type: "object",
  required: ["newTags", "moves"],
  additionalProperties: false,
  properties: {
    newTags: {
      type: "array",
      items: {
        type: "object",
        required: ["tempId", "name", "parentId"],
        additionalProperties: false,
        properties: {
          tempId: {
            type: "string",
            minLength: 1,
          },
          name: {
            type: "string",
            minLength: 1,
          },
          parentId: {
            type: ["string", "null"],
          },
        },
      },
    },
    moves: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "parentId"],
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            minLength: 1,
          },
          parentId: {
            type: ["string", "null"],
          },
        },
      },
    },
  },
} as const;

/** CRUD routes for the tag taxonomy, mounted under `/api/tags`. */
export async function tagRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/tags", "tags", bulkDeleteTags);

  app.post("/api/tags/reparent-plan", {
    schema: {
      tags: ["tags"],
      body: reparentPlanBody,
    },
  }, async req => applyTagReparentPlan(req.body as TagReparentPlanInput));

  app.post("/api/tags/bulk-reparent", {
    schema: {
      tags: ["tags"],
      body: bulkReparentBody,
    },
  }, async (req) => {
    const {
      ids, parentId,
    } = req.body as { ids: string[];
      parentId: string | null; };
    return bulkReparentTags(ids, parentId);
  });

  app.get("/api/tags", {
    schema: {
      tags: ["tags"],
    },
  }, async () => listTags());

  app.get("/api/tags/tree", {
    schema: {
      tags: ["tags"],
    },
  }, async () => getTagTree());

  app.post("/api/tags", {
    schema: {
      tags: ["tags"],
      body: createTagBody,
    },
  }, async (req, reply) => {
    const tag = await createTag(req.body as CreateTagInput);
    return reply.code(201).send(tag);
  });

  app.patch("/api/tags/:id", {
    schema: {
      tags: ["tags"],
      params: tagParams,
      body: updateTagBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const tag = await updateTag(id, req.body as UpdateTagInput);
    if (!tag) throw new NotFoundError("Tag");
    return tag;
  });

  app.delete("/api/tags/:id", {
    schema: {
      tags: ["tags"],
      params: tagParams,
      querystring: deleteTagQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      reassignTo,
    } = req.query as { reassignTo?: string };
    const deleted = await deleteTag(id, reassignTo);
    if (!deleted) throw new NotFoundError("Tag");
    return reply.code(204).send();
  });

  app.delete("/api/tags/:id/associations", {
    schema: {
      tags: ["tags"],
      params: tagParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const removed = await removeTagBookmarkAssociations(id);
    if (!removed) throw new NotFoundError("Tag");
    return reply.code(204).send();
  });
}
