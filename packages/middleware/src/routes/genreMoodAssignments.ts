import type { FastifyInstance } from "fastify";
import type { GenreMoodOwnerType } from "@eesimple/types";
import { GENRE_MOOD_OWNER_TYPES } from "@eesimple/types";
import {
  getOwnerGenreMoods,
  setOwnerGenreMoods,
} from "@/services/genreMoodAssignments";

const assignmentParams = {
  type: "object",
  required: ["ownerType", "ownerId"],
  properties: {
    ownerType: {
      type: "string",
      enum: [...GENRE_MOOD_OWNER_TYPES],
    },
    ownerId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const setAssignmentsBody = {
  type: "object",
  required: ["genreMoodIds"],
  additionalProperties: false,
  properties: {
    genreMoodIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** Read/replace the Genres & Moods entries attached to any owner, mounted under `/api/genre-mood-assignments`. */
export async function genreMoodAssignmentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/genre-mood-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["genre-moods"],
      params: assignmentParams,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: GenreMoodOwnerType;
      ownerId: string; };
    return getOwnerGenreMoods(ownerType, ownerId);
  });

  app.put("/api/genre-mood-assignments/:ownerType/:ownerId", {
    schema: {
      tags: ["genre-moods"],
      params: assignmentParams,
      body: setAssignmentsBody,
    },
  }, async (req) => {
    const {
      ownerType, ownerId,
    } = req.params as { ownerType: GenreMoodOwnerType;
      ownerId: string; };
    const {
      genreMoodIds,
    } = req.body as { genreMoodIds: string[] };
    return setOwnerGenreMoods(ownerType, ownerId, genreMoodIds);
  });
}
