import type { FastifyInstance } from "fastify";
import type { CreateGroupTypeInput, UpdateGroupTypeInput } from "@eesimple/types";
import {
  bulkDeleteGroupTypes,
  createGroupType,
  deleteGroupType,
  getGroupTypeBySlug,
  listGroupTypes,
  updateGroupType,
} from "@/services/groupTypes";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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
    description: {
      type: ["string", "null"],
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
    description: {
      type: ["string", "null"],
    },
    sortOrder: {
      type: "integer",
    },
    hidden: {
      type: "boolean",
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
    if (!groupType) throw new NotFoundError("Group type");
    return groupType;
  });

  app.post("/api/group-types", {
    schema: {
      tags: ["group-types"],
      body: createGroupTypeBody,
    },
  }, async (req, reply) => {
    const groupType = await createGroupType(req.body as CreateGroupTypeInput);
    return reply.code(201).send(groupType);
  });

  app.patch("/api/group-types/:id", {
    schema: {
      tags: ["group-types"],
      params: groupTypeParams,
      body: updateGroupTypeBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const groupType = await updateGroupType(id, req.body as UpdateGroupTypeInput);
    if (!groupType) throw new NotFoundError("Group type");
    return groupType;
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
    if (!deleted) throw new NotFoundError("Group type");
    return reply.code(204).send();
  });
}
