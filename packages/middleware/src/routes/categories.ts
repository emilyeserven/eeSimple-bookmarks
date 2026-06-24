import type { FastifyInstance } from "fastify";
import type {
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
  UpdateCategoryRootTagsInput,
} from "@eesimple/types";
import {
  bulkDeleteCategories,
  BuiltInCategoryError,
  createCategory,
  deleteCategory,
  getCategoryDefaults,
  getCategoryRootTags,
  InvalidRootTagError,
  listCategories,
  setCategoryDefaults,
  setCategoryRootTags,
  updateCategory,
} from "@/services/categories";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const categoryParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createCategoryBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: ["string", "null"],
    },
    icon: {
      type: ["string", "null"],
    },
    isHomepage: {
      type: "boolean",
    },
  },
} as const;

const updateCategoryBody = {
  type: "object",
  additionalProperties: false,
  properties: createCategoryBody.properties,
} as const;

const tagIdsBody = {
  type: "object",
  required: ["tagIds"],
  additionalProperties: false,
  properties: {
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

const defaultsBody = {
  type: "object",
  required: ["numberValues", "booleanValues", "dateTimeValues"],
  additionalProperties: false,
  properties: {
    numberValues: {
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
    },
    booleanValues: {
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
    },
    dateTimeValues: {
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
            type: "string",
          },
        },
      },
    },
  },
} as const;

/** CRUD routes for categories plus homepage/root-tag config, under `/api`. */
export async function categoryRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/categories", "categories", bulkDeleteCategories);

  app.get("/api/categories", {
    schema: {
      tags: ["categories"],
    },
  }, async () => listCategories());

  app.post("/api/categories", {
    schema: {
      tags: ["categories"],
      body: createCategoryBody,
    },
  }, async (req, reply) => {
    const category = await createCategory(req.body as CreateCategoryInput);
    return reply.code(201).send(category);
  });

  app.patch("/api/categories/:id", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
      body: updateCategoryBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const category = await updateCategory(id, req.body as UpdateCategoryInput);
      if (!category) return reply.code(404).send({
        message: "Category not found",
      });
      return category;
    }
    catch (err) {
      if (err instanceof BuiltInCategoryError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/categories/:id", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const deleted = await deleteCategory(id);
      if (!deleted) return reply.code(404).send({
        message: "Category not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInCategoryError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.get("/api/categories/:id/root-tags", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return {
      tagIds: await getCategoryRootTags(id),
    };
  });

  app.put("/api/categories/:id/root-tags", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
      body: tagIdsBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      tagIds,
    } = req.body as UpdateCategoryRootTagsInput;
    try {
      const result = await setCategoryRootTags(id, tagIds);
      if (result === null) return reply.code(404).send({
        message: "Category not found",
      });
      return {
        tagIds: result,
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

  app.get("/api/categories/:id/defaults", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    return getCategoryDefaults(id);
  });

  app.put("/api/categories/:id/defaults", {
    schema: {
      tags: ["categories"],
      params: categoryParams,
      body: defaultsBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const result = await setCategoryDefaults(id, req.body as UpdateCategoryDefaultsInput);
    if (result === null) return reply.code(404).send({
      message: "Category not found",
    });
    return result;
  });
}
