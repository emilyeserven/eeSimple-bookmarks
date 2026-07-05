import type { FastifyInstance } from "fastify";
import type { LanguageUsageOwnerType, UpdateLanguageUsageEntry } from "@eesimple/types";
import { LANGUAGE_USAGE_OWNER_TYPES } from "@eesimple/types";
import { getLanguageUsages, listLanguageUsagesByOwnerType, setLanguageUsages } from "@/services/languageUsages";

const ownerParams = {
  type: "object",
  required: ["ownerType", "ownerId"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...LANGUAGE_USAGE_OWNER_TYPES],
    },
    ownerId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const ownerTypeOnlyParams = {
  type: "object",
  required: ["ownerType"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...LANGUAGE_USAGE_OWNER_TYPES],
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
        required: ["languageId", "usageLevelId"],
        additionalProperties: false,
        properties: {
          languageId: {
            type: "string",
            format: "uuid",
          },
          usageLevelId: {
            type: "string",
            format: "uuid",
          },
          translationSourceId: {
            type: ["string", "null"],
            format: "uuid",
          },
          note: {
            type: ["string", "null"],
          },
        },
      },
    },
  },
} as const;

/** Polymorphic language-usage associations, mounted under `/api/language-usages/:ownerType/:ownerId`. */
export async function languageUsageRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/language-usages/by-owner-type/:ownerType", {
    schema: {
      tags: ["language-usages"],
      params: ownerTypeOnlyParams,
    },
  }, async (req) => {
    const {
      ownerType,
    } = req.params as { ownerType: LanguageUsageOwnerType };
    return listLanguageUsagesByOwnerType(ownerType);
  });

  app.get("/api/language-usages/:ownerType/:ownerId", {
    schema: {
      tags: ["language-usages"],
      params: ownerParams,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: LanguageUsageOwnerType;
      ownerId: string; };
    return getLanguageUsages(ownerType, ownerId);
  });

  app.put("/api/language-usages/:ownerType/:ownerId", {
    schema: {
      tags: ["language-usages"],
      params: ownerParams,
      body: putBody,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: LanguageUsageOwnerType;
      ownerId: string; };
    const {
      entries,
    } = req.body as { entries: UpdateLanguageUsageEntry[] };
    await setLanguageUsages(ownerType, ownerId, entries);
    return getLanguageUsages(ownerType, ownerId);
  });
}
