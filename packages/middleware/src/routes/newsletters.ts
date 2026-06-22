import type { FastifyInstance } from "fastify";
import type {
  CreateNewsletterInput,
  UpdateNewsletterInput,
} from "@eesimple/types";
import { listNewsletterIssues } from "@/services/imports";
import {
  createNewsletter,
  deleteNewsletter,
  DuplicateNewsletterError,
  getNewsletter,
  listNewsletters,
  updateNewsletter,
} from "@/services/newsletters";

const idParam = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createNewsletterBody = {
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

const updateNewsletterBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    categoryId: {
      type: ["string", "null"],
      format: "uuid",
    },
    mediaTypeId: {
      type: ["string", "null"],
      format: "uuid",
    },
    tagIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** The "Newsletters" publication taxonomy — CRUD plus a newsletter's issues (= its imports). */
export async function newsletterRoutes(app: FastifyInstance): Promise<void> {
  // List all newsletters.
  app.get("/api/newsletters", {
    schema: {
      tags: ["newsletters"],
    },
  }, () => listNewsletters());

  // Create a newsletter by name.
  app.post("/api/newsletters", {
    schema: {
      tags: ["newsletters"],
      body: createNewsletterBody,
    },
  }, async (req, reply) => {
    try {
      return await createNewsletter(req.body as CreateNewsletterInput);
    }
    catch (err) {
      if (err instanceof DuplicateNewsletterError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  // List a newsletter's issues (= its imports), newest first.
  app.get("/api/newsletters/:id/issues", {
    schema: {
      tags: ["newsletters"],
      params: idParam,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    if (!(await getNewsletter(id))) return reply.code(404).send({
      message: "Newsletter not found",
    });
    return listNewsletterIssues(id);
  });

  // Update a newsletter (rename / default category / tags / media type).
  app.patch("/api/newsletters/:id", {
    schema: {
      tags: ["newsletters"],
      params: idParam,
      body: updateNewsletterBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const updated = await updateNewsletter(id, req.body as UpdateNewsletterInput);
      if (!updated) return reply.code(404).send({
        message: "Newsletter not found",
      });
      return updated;
    }
    catch (err) {
      if (err instanceof DuplicateNewsletterError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  // Delete a newsletter.
  app.delete("/api/newsletters/:id", {
    schema: {
      tags: ["newsletters"],
      params: idParam,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const ok = await deleteNewsletter(id);
    if (!ok) return reply.code(404).send({
      message: "Newsletter not found",
    });
    return reply.code(204).send();
  });
}
