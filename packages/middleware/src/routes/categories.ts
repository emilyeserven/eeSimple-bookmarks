import type { FastifyInstance } from "fastify";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@eesimple/types";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/services/categories";

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
  },
} as const;

const updateCategoryBody = {
  type: "object",
  additionalProperties: false,
  properties: createCategoryBody.properties,
} as const;

/** CRUD routes for categories, under `/api/categories`. */
export async function categoryRoutes(app: FastifyInstance): Promise<void> {
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
    const category = await updateCategory(id, req.body as UpdateCategoryInput);
    if (!category) return reply.code(404).send({
      message: "Category not found",
    });
    return category;
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
    const deleted = await deleteCategory(id);
    if (!deleted) return reply.code(404).send({
      message: "Category not found",
    });
    return reply.code(204).send();
  });
}
