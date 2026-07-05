import type { FastifyInstance } from "fastify";
import type { LocationAssignmentOwnerType } from "@eesimple/types";
import { LOCATION_ASSIGNMENT_OWNER_TYPES } from "@eesimple/types";
import {
  getOwnerLocations,
  setOwnerLocations,
} from "@/services/locationAssignments";

const assignmentParams = {
  type: "object",
  required: ["ownerType", "ownerId"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...LOCATION_ASSIGNMENT_OWNER_TYPES],
    },
    ownerId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const setAssignmentsBody = {
  type: "object",
  required: ["locationIds"],
  additionalProperties: false,
  properties: {
    locationIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** Read/replace the Locations attached to any owner, mounted under `/api/location-assignments`. */
export async function locationAssignmentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/location-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["locations"],
      params: assignmentParams,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: LocationAssignmentOwnerType;
      ownerId: string; };
    return getOwnerLocations(ownerType, ownerId);
  });

  app.put("/api/location-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["locations"],
      params: assignmentParams,
      body: setAssignmentsBody,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: LocationAssignmentOwnerType;
      ownerId: string; };
    const {
      locationIds,
    } = req.body as { locationIds: string[] };
    return setOwnerLocations(ownerType, ownerId, locationIds);
  });
}
