import type { FastifyInstance } from "fastify";
import type {
  CreateLanguageInput,
  UpdateLanguageInput,
} from "@eesimple/types";
import {
  bulkDeleteLanguages,
  createLanguage,
  deleteLanguage,
  listLanguages,
  updateLanguage,
} from "@/services/languages";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

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
    description: {
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
    description: {
      type: ["string", "null"],
    },
    sortOrder: {
      type: "integer",
    },
    isFavorite: {
      type: "boolean",
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
    const language = await createLanguage(req.body as CreateLanguageInput);
    return reply.code(201).send(language);
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
    const language = await updateLanguage(id, req.body as UpdateLanguageInput);
    if (!language) throw new NotFoundError("Language");
    return language;
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
    const deleted = await deleteLanguage(id);
    if (!deleted) throw new NotFoundError("Language");
    return reply.code(204).send();
  });
}
