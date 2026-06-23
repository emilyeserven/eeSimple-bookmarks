import type { FastifyInstance } from "fastify";
import type { CreateAuthorInput, UpdateAuthorInput } from "@eesimple/types";
import {
  createAuthor,
  deleteAuthor,
  DuplicateAuthorError,
  listAuthors,
  updateAuthor,
} from "@/services/authors";

const authorParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createAuthorBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

const updateAuthorBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
  },
} as const;

/** Routes for the Authors taxonomy, mounted under `/api/authors`. */
export async function authorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/authors", {
    schema: {
      tags: ["authors"],
    },
  }, async () => listAuthors());

  app.post("/api/authors", {
    schema: {
      tags: ["authors"],
      body: createAuthorBody,
    },
  }, async (req, reply) => {
    try {
      const author = await createAuthor(req.body as CreateAuthorInput);
      return reply.code(201).send(author);
    }
    catch (err) {
      if (err instanceof DuplicateAuthorError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/authors/:id", {
    schema: {
      tags: ["authors"],
      params: authorParams,
      body: updateAuthorBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const author = await updateAuthor(id, req.body as UpdateAuthorInput);
      if (!author) return reply.code(404).send({
        message: "Author not found",
      });
      return author;
    }
    catch (err) {
      if (err instanceof DuplicateAuthorError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/authors/:id", {
    schema: {
      tags: ["authors"],
      params: authorParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const deleted = await deleteAuthor(id);
    if (!deleted) return reply.code(404).send({
      message: "Author not found",
    });
    return reply.code(204).send();
  });
}
