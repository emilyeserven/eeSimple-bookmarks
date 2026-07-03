import type { FastifyInstance } from "fastify";
import type {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "@eesimple/types";
import {
  BuiltInLanguageError,
  bulkDeleteLanguages,
  createLanguage,
  deleteLanguage,
  DuplicateLanguageError,
  listLanguages,
  updateLanguage,
} from "@/services/languages";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const languageParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createLanguageBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    isoCode: {
      type: ["string", "null"],
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const updateLanguageBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    isoCode: {
      type: ["string", "null"],
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

/** Routes for the "Languages" taxonomy, mounted under `/api/languages`. */
export async function languageRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/languages", "languages", bulkDeleteLanguages);

  app.get("/api/languages", {
    schema: {
      tags: ["languages"],
    },
  }, async () => listLanguages());

  app.post("/api/languages", {
    schema: {
      tags: ["languages"],
      body: createLanguageBody,
    },
  }, async (req, reply) => {
    try {
      const language = await createLanguage(req.body as CreateLanguageInput);
      return reply.code(201).send(language);
    }
    catch (err) {
      if (err instanceof DuplicateLanguageError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/languages/:id", {
    schema: {
      tags: ["languages"],
      params: languageParams,
      body: updateLanguageBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const language = await updateLanguage(id, req.body as UpdateLanguageInput);
      if (!language) return reply.code(404).send({
        message: "Language not found",
      });
      return language;
    }
    catch (err) {
      if (err instanceof DuplicateLanguageError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInLanguageError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/languages/:id", {
    schema: {
      tags: ["languages"],
      params: languageParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const deleted = await deleteLanguage(id);
      if (!deleted) return reply.code(404).send({
        message: "Language not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof BuiltInLanguageError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
