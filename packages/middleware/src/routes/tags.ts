import type { FastifyInstance } from "fastify";
import type {
  CreateTagInput,
  UpdateTagCategoriesInput,
  UpdateTagInput,
} from "@eesimple/types";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { InvalidRootTagError } from "@/services/categories";
import {
  bulkDeleteTags,
  createTag,
  deleteTag,
  getTagCategories,
  getTagTree,
  listTags,
  setTagCategories,
  TagCycleError,
  updateTag,
} from "@/services/tags";

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
  },
} as const;

const categoryIdsBody = {
  type: "object",
  required: ["categoryIds"],
  additionalProperties: false,
  properties: {
    categoryIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** CRUD routes for the tag taxonomy, mounted under `/api/tags`. */
export async function tagRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/tags", "tags", bulkDeleteTags);

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
    try {
      const tag = await updateTag(id, req.body as UpdateTagInput);
      if (!tag) return reply.code(404).send({
        message: "Tag not found",
      });
      return tag;
    }
    catch (err) {
      if (err instanceof TagCycleError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
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
    if (!deleted) return reply.code(404).send({
      message: "Tag not found",
    });
    return reply.code(204).send();
  });

  app.get("/api/tags/:id/categories", {
    schema: {
      tags: ["tags"],
      params: tagParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return {
      categoryIds: await getTagCategories(id),
    };
  });

  app.put("/api/tags/:id/categories", {
    schema: {
      tags: ["tags"],
      params: tagParams,
      body: categoryIdsBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      categoryIds,
    } = req.body as UpdateTagCategoriesInput;
    try {
      const result = await setTagCategories(id, categoryIds);
      if (result === null) return reply.code(404).send({
        message: "Tag not found",
      });
      return {
        categoryIds: result,
      };
    }
    catch (err) {
      if (err instanceof InvalidRootTagError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
