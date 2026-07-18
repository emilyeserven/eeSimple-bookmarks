import type { FastifyInstance } from "fastify";
import type {
  CreateTagInput,
  UpdateTagInput,
} from "@eesimple/types";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import {
  bulkDeleteTags,
  bulkReparentTags,
  createTag,
  deleteTag,
  getTagTree,
  listTags,
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

/** CRUD routes for the tag taxonomy, mounted under `/api/tags`. */
export async function tagRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/tags", "tags", bulkDeleteTags);

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
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteTag(id);
    if (!deleted) throw new NotFoundError("Tag");
    return reply.code(204).send();
  });
}
