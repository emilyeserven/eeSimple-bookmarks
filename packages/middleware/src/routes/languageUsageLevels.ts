import type { FastifyInstance } from "fastify";
import type { CreateLanguageUsageLevelInput, LanguageUsageKind, UpdateLanguageUsageLevelInput } from "@eesimple/types";
import {
  BuiltInLanguageUsageLevelError,
  bulkDeleteLanguageUsageLevels,
  createLanguageUsageLevel,
  deleteLanguageUsageLevel,
  DuplicateLanguageUsageLevelError,
  InvalidReassignTargetError,
  listLanguageUsageLevels,
  updateLanguageUsageLevel,
} from "@/services/languageUsageLevels";
import { registerBulkDelete } from "@/routes/bulkDeleteRoute";

const levelParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const listQuery = {
  type: "object",
  additionalProperties: false,
  properties: {
    kind: {
      type: "string",
      enum: ["availability", "proficiency"],
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
  required: ["name", "kind"],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    kind: {
      type: "string",
      enum: ["availability", "proficiency"],
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

/** Routes for the Language Usage Levels vocabulary, mounted under `/api/language-usage-levels`. */
export async function languageUsageLevelRoutes(app: FastifyInstance): Promise<void> {
  registerBulkDelete(app, "/api/language-usage-levels", "language-usage-levels", bulkDeleteLanguageUsageLevels);

  app.get("/api/language-usage-levels", {
    schema: {
      tags: ["language-usage-levels"],
      querystring: listQuery,
    },
  }, async (req) => {
    const {
      kind,
    } = req.query as { kind?: LanguageUsageKind };
    return listLanguageUsageLevels(kind);
  });

  app.post("/api/language-usage-levels", {
    schema: {
      tags: ["language-usage-levels"],
      body: createBody,
    },
  }, async (req, reply) => {
    try {
      const level = await createLanguageUsageLevel(req.body as CreateLanguageUsageLevelInput);
      return reply.code(201).send(level);
    }
    catch (err) {
      if (err instanceof DuplicateLanguageUsageLevelError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch("/api/language-usage-levels/:id", {
    schema: {
      tags: ["language-usage-levels"],
      params: levelParams,
      body: updateBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    try {
      const level = await updateLanguageUsageLevel(id, req.body as UpdateLanguageUsageLevelInput);
      if (!level) return reply.code(404).send({
        message: "Usage level not found",
      });
      return level;
    }
    catch (err) {
      if (err instanceof DuplicateLanguageUsageLevelError) {
        return reply.code(409).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInLanguageUsageLevelError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete("/api/language-usage-levels/:id", {
    schema: {
      tags: ["language-usage-levels"],
      params: levelParams,
      querystring: deleteQuery,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const {
      reassignTo,
    } = req.query as { reassignTo?: string };
    try {
      const deleted = await deleteLanguageUsageLevel(id, reassignTo);
      if (!deleted) return reply.code(404).send({
        message: "Usage level not found",
      });
      return reply.code(204).send();
    }
    catch (err) {
      if (err instanceof InvalidReassignTargetError) {
        return reply.code(400).send({
          message: err.message,
        });
      }
      if (err instanceof BuiltInLanguageUsageLevelError) {
        return reply.code(403).send({
          message: err.message,
        });
      }
      throw err;
    }
  });
}
