import type { FastifyInstance } from "fastify";
import type { CreateGroupInput, UpdateGroupInput } from "@eesimple/types";
import { SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import {
  bulkDeleteGroups,
  createGroup,
  deleteGroup,
  DuplicateGroupError,
  getGroupBySlug,
  listGroups,
  updateGroup,
} from "@/services/groups";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const groupParams = {
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

const createGroupBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    romanizedName: {
      type: ["string", "null"],
    },
    websiteId: {
      type: ["string", "null"],
      format: "uuid",
    },
    groupTypeId: {
      type: ["string", "null"],
      format: "uuid",
    },
  },
} as const;

const socialLinksSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["platform", "url"],
    additionalProperties: false,
    properties: {
      platform: {
        type: "string",
        enum: SOCIAL_MEDIA_PLATFORMS,
      },
      url: {
        type: "string",
        minLength: 1,
      },
    },
  },
} as const;

const updateGroupBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...createGroupBody.properties,
    socialLinks: socialLinksSchema,
  },
} as const;

/** Routes for the Groups taxonomy, mounted under `/api/groups`. */
export async function groupRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/groups", "groups", bulkDeleteGroups);

  app.get("/api/groups", {
    schema: {
      tags: ["groups"],
    },
  }, async () => listGroups());

  app.get("/api/groups/by-slug:slug", {
    schema: {
      tags: ["groups"],
      params: slugParams,
    },
  }, async (req, reply) => {
    const {
      slug,
    } = req.params as { slug: string };
    const group = await getGroupBySlug(slug);
    if (!group) return reply.code(404).send({
      message: "Group not found",
    });
    return group;
  });

  app.post("/api/groups", {
    schema: {
      tags: ["groups"],
      body: createGroupBody,
    },
  }, async (req, reply) => {
    try {
      const group = await createGroup(req.body as CreateGroupInput);
      return reply.code(201).send(group);
    }
    catch (err) {
      if (err instanceof DuplicateGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/groups/:id", {
    schema: {
      tags: ["groups"],
      params: groupParams,
      body: updateGroupBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const group = await updateGroup(id, req.body as UpdateGroupInput);
      if (!group) return reply.code(404).send({
        message: "Group not found",
      });
      return group;
    }
    catch (err) {
      if (err instanceof DuplicateGroupError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/groups/:id", {
    schema: {
      tags: ["groups"],
      params: groupParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteGroup(id);
    if (!deleted) return reply.code(404).send({
      message: "Group not found",
    });
    return reply.code(204).send();
  });
}
