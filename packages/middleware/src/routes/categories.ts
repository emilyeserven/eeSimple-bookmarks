import type { FastifyInstance } from "fastify";
import type {
  CreateCategoryInput,
  UpdateCategoryDefaultsInput,
  UpdateCategoryInput,
} from "@eesimple/types";
import {
  bulkDeleteCategories,
  createCategory,
  deleteCategory,
  getCategoryDefaults,
  listCategories,
  setCategoryDefaults,
  updateCategory,
} from "@/services/categories";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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

/** CRUD routes for categories plus their default property values, under `/api`. */
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
    const category = await updateCategory(id, req.body as UpdateCategoryInput);
    if (!category) throw new NotFoundError("Category");
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
    if (!deleted) throw new NotFoundError("Category");
    return reply.code(204).send();
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
    if (result === null) throw new NotFoundError("Category");
    return result;
  });
}
