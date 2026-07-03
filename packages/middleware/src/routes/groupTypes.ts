import type { FastifyInstance } from "fastify";
import type { CreateGroupTypeInput, UpdateGroupTypeInput } from "@eesimple/types";
import {
  bulkDeleteGroupTypes,
  createGroupType,
  deleteGroupType,
  DuplicateGroupTypeError,
  getGroupTypeBySlug,
  listGroupTypes,
  updateGroupType,
} from "@/services/groupTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const groupTypeParams = {
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
    },
  },
} as const;

const createGroupTypeBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const updateGroupTypeBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

/** CRUD routes for the Group Types taxonomy, mounted under `/api/group-types`. */
export async function groupTypeRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/group-types", "group-types", bulkDeleteGroupTypes);

  app.get("/api/group-types", {
    schema: {
      tags: ["group-types"],
    },
  }, async () => listGroupTypes());

  app.get("/api/group-types/by-slug:slug", {
    schema: {
      tags: ["group-types"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const groupType = await getGroupTypeBySlug(slug);
    if (!groupType) return reply.code(404).send({
      message: "Group type not found",
    });
    return groupType;
  });

  app.post("/api/group-types", {
    schema: {
      tags: ["group-types"],
      body: createGroupTypeBody,
    },
  }, async (req, reply) => {
    try {
      const groupType = await createGroupType(req.body as CreateGroupTypeInput);
      return reply.code(201).send(groupType);
    }
    catch (err) {
      if (err instanceof DuplicateGroupTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/group-types/:id", {
    schema: {
      tags: ["group-types"],
      params: groupTypeParams,
      body: updateGroupTypeBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const groupType = await updateGroupType(id, req.body as UpdateGroupTypeInput);
      if (!groupType) return reply.code(404).send({
        message: "Group type not found",
      });
      return groupType;
    }
    catch (err) {
      if (err instanceof DuplicateGroupTypeError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/group-types/:id", {
    schema: {
      tags: ["group-types"],
      params: groupTypeParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteGroupType(id);
    if (!deleted) return reply.code(404).send({
      message: "Group type not found",
    });
    return reply.code(204).send();
  });
}
