import type { FastifyInstance } from "fastify";
import type { CreateGenreMoodInput, UpdateGenreMoodInput } from "@eesimple/types";
import {
  bulkDeleteGenreMoods,
  createGenreMood,
  deleteGenreMood,
  DuplicateGenreMoodError,
  GenreMoodCycleError,
  getGenreMoodTree,
  listGenreMoods,
  updateGenreMood,
} from "@/services/genreMoods";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const genreMoodParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createGenreMoodBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

const updateGenreMoodBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    parentId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
} as const;

/** Routes for the "Genres & Moods" taxonomy, mounted under `/api/genre-moods`. */
export async function genreMoodRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/genre-moods", "genre-moods", bulkDeleteGenreMoods);

  app.get("/api/genre-moods", {
    schema: {
      tags: ["genre-moods"],
    },
  }, async () => listGenreMoods());

  app.get("/api/genre-moods/tree", {
    schema: {
      tags: ["genre-moods"],
    },
  }, async () => getGenreMoodTree());

  app.post("/api/genre-moods", {
    schema: {
      tags: ["genre-moods"],
      body: createGenreMoodBody,
    },
  }, async (req, reply) => {
    try {
      const genreMood = await createGenreMood(req.body as CreateGenreMoodInput);
      return reply.code(201).send(genreMood);
    }
    catch (err) {
      if (err instanceof DuplicateGenreMoodError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/genre-moods/:id", {
    schema: {
      tags: ["genre-moods"],
      params: genreMoodParams,
      body: updateGenreMoodBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const genreMood = await updateGenreMood(id, req.body as UpdateGenreMoodInput);
      if (!genreMood) return reply.code(404).send({
        message: "Genres & Moods entry not found",
      });
      return genreMood;
    }
    catch (err) {
      if (err instanceof DuplicateGenreMoodError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof GenreMoodCycleError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/genre-moods/:id", {
    schema: {
      tags: ["genre-moods"],
      params: genreMoodParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteGenreMood(id);
    if (!deleted) return reply.code(404).send({
      message: "Genres & Moods entry not found",
    });
    return reply.code(204).send();
  });
}
