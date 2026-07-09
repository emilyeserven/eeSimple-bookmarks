import type { FastifyInstance } from "fastify";
import type { TaxonomyOwnerType } from "@eesimple/types";
import { TAXONOMY_OWNER_TYPES } from "@eesimple/types";
import {
  getOwnerTaxonomyTerms,
  listTermIdsByOwnerType,
  setOwnerTaxonomyTerms,
} from "@/services/taxonomyAssignments";

const assignmentParams = {
  type: "object",
  required: ["ownerType", "ownerId"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...TAXONOMY_OWNER_TYPES],
    },
    ownerId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const byOwnerTypeParams = {
  type: "object",
  required: ["taxonomyId", "ownerType"],
  properties: {
    taxonomyId: {
      type: "string",
      format: "uuid",
    },
    ownerType: {
      type: "string",
      enum: [...TAXONOMY_OWNER_TYPES],
    },
  },
} as const;

const setAssignmentsBody = {
  type: "object",
  required: ["taxonomyId", "termIds"],
  additionalProperties: false,
  properties: {
    taxonomyId: {
      type: "string",
      format: "uuid",
    },
    termIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** Read/replace the taxonomy terms attached to any owner, mounted under `/api/taxonomy-assignments`. */
export async function taxonomyAssignmentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/taxonomy-assignments/by-owner-type/:taxonomyId/:ownerType", {
    schema: {
      tags: ["taxonomies"],
      params: byOwnerTypeParams,
    },
  }, async (req) => {
    const {
      taxonomyId, ownerType,
    } = req.params as { taxonomyId: string;
      ownerType: TaxonomyOwnerType; };
    return listTermIdsByOwnerType(taxonomyId, ownerType);
  });

  app.get("/api/taxonomy-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["taxonomies"],
      params: assignmentParams,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: TaxonomyOwnerType;
      ownerId: string; };
    return getOwnerTaxonomyTerms(ownerType, ownerId);
  });

  app.put("/api/taxonomy-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["taxonomies"],
      params: assignmentParams,
      body: setAssignmentsBody,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: TaxonomyOwnerType;
      ownerId: string; };
    const {
      taxonomyId, termIds,
    } = req.body as { taxonomyId: string;
      termIds: string[]; };
    return setOwnerTaxonomyTerms(taxonomyId, ownerType, ownerId, termIds);
  });
}
