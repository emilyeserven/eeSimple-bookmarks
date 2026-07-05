import type { FastifyInstance } from "fastify";
import type { CreateTranslationSourceInput, UpdateTranslationSourceInput } from "@eesimple/types";
import {
  bulkDeleteTranslationSources,
  createTranslationSource,
  deleteTranslationSource,
  listTranslationSources,
  updateTranslationSource,
} from "@/services/translationSources";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";
import { NotFoundError } from "@/utils/errors";

const sourceParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const deleteQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    reassignTo: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createBody = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    sortOrder: {
      type: "integer",
    },
  },
} as const;

/** Routes for the Translation Sources vocabulary, mounted under `/api/translation-sources`. */
export async function translationSourceRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/translation-sources", "translation-sources", bulkDeleteTranslationSources);

  app.get("/api/translation-sources", {
    schema: {
      tags: ["translation-sources"],
    },
  }, async () => listTranslationSources());

  app.post("/api/translation-sources", {
    schema: {
      tags: ["translation-sources"],
      body: createBody,
    },
  }, async (req, reply) => {
    const source = await createTranslationSource(req.body as CreateTranslationSourceInput);
    return reply.code(201).send(source);
  });

  app.patch("/api/translation-sources/:id", {
    schema: {
      tags: ["translation-sources"],
      params: sourceParams,
      body: updateBody,
    },
  }, async (req) => {
    const {
      id,
    } = req.params as { id: string };
    const source = await updateTranslationSource(id, req.body as UpdateTranslationSourceInput);
    if (!source) throw new NotFoundError("Translation source");
    return source;
  });

  app.delete("/api/translation-sources/:id", {
    schema: {
      tags: ["translation-sources"],
      params: sourceParams,
      querystring: deleteQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      reassignTo,
    } = req.query as { reassignTo?: string };
    const deleted = await deleteTranslationSource(id, reassignTo);
    if (!deleted) throw new NotFoundError("Translation source");
    return reply.code(204).send();
  });
}
