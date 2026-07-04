import type { FastifyInstance } from "fastify";
import type { EntityNameOwnerType, UpdateEntityNameEntry } from "@eesimple/types";
import { ENTITY_NAME_OWNER_TYPES } from "@eesimple/types";
import { getEntityNames, setEntityNames } from "@/services/entityNames";

const ownerParams = {
  type: "object",
  required: ["ownerType", "ownerId"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...ENTITY_NAME_OWNER_TYPES],
    },
    ownerId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const putBody = {
  type: "object",
  required: ["entries"],
  additionalProperties: false,
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        required: ["languageId", "value"],
        additionalProperties: false,
        properties: {
          languageId: {
            type: "string",
            format: "uuid",
          },
          value: {
            type: "string",
          },
          isPrimary: {
            type: "boolean",
          },
        },
      },
    },
  },
} as const;

/** Polymorphic multilingual-name associations, mounted under `/api/entity-names/:ownerType/:ownerId`. */
export async function entityNameRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/entity-names/:ownerType/:ownerId", {
    schema: {
      tags: ["entity-names"],
      params: ownerParams,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: EntityNameOwnerType;
      ownerId: string; };
    return getEntityNames(ownerType, ownerId);
  });

  app.put("/api/entity-names/:ownerType/:ownerId", {
    schema: {
      tags: ["entity-names"],
      params: ownerParams,
      body: putBody,
    },
  }, async (req, reply) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: EntityNameOwnerType;
      ownerId: string; };
    const {
      entries,
    } = req.body as { entries: UpdateEntityNameEntry[] };
    try {
      await setEntityNames(ownerType, ownerId, entries);
    }
    catch (err) {
      return reply.status(400).send({
        message: err instanceof Error ? err.message : "Invalid entity names.",
      });
    }
    return getEntityNames(ownerType, ownerId);
  });
}
