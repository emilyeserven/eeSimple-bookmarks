import type { FastifyInstance } from "fastify";
import type { EntityLayout, LayoutableEntityKind } from "@eesimple/types";
import { isValidEntityLayout } from "@eesimple/types";
import { deleteEntityLayout, listEntityLayouts, upsertEntityLayout } from "@/services/entityLayouts";
import { entityLayoutSchema, layoutableEntityKindSchema } from "@/routes/entityLayoutsSchema";
import { ValidationError } from "@/utils/errors";

const kindParams = {
  type: "object",
  required: ["kind"],
  properties: {
    kind: layoutableEntityKindSchema,
  },
} as const;

const saveBody = {
  type: "object",
  required: ["layout"],
  additionalProperties: false,
  properties: {
    layout: entityLayoutSchema,
  },
} as const;

/**
 * The `:kind` param for the "clear invalid row" route — a PLAIN string, not the
 * `layoutableEntityKindSchema` enum, so a corrupted row stored under any key (including a non-enum
 * `taxonomy:<id>` key) can still be reset.
 */
const invalidKindParams = {
  type: "object",
  required: ["kind"],
  properties: {
    kind: {
      type: "string",
    },
  },
} as const;

/** List/save/reset per-entity-kind stored page layouts. */
export async function entityLayoutsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/entity-layouts", {
    schema: {
      tags: ["entity-layouts"],
    },
  }, async () => listEntityLayouts());

  app.put("/api/entity-layouts/:kind", {
    schema: {
      tags: ["entity-layouts"],
      params: kindParams,
      body: saveBody,
    },
  }, async (req) => {
    const {
      kind,
    } = req.params as { kind: LayoutableEntityKind };
    const {
      layout,
    } = req.body as { layout: EntityLayout };
    if (!isValidEntityLayout(layout)) {
      throw new ValidationError("Invalid layout shape");
    }
    return upsertEntityLayout(kind, layout);
  });

  app.delete("/api/entity-layouts/:kind", {
    schema: {
      tags: ["entity-layouts"],
      params: kindParams,
    },
  }, async (req, reply) => {
    const {
      kind,
    } = req.params as { kind: LayoutableEntityKind };
    await deleteEntityLayout(kind);
    reply.status(204);
  });

  // Clear a corrupted stored layout, keyed by its raw (possibly non-enum) kind string. The static
  // `invalid/` prefix is matched ahead of the enum `:kind` route above, so there's no collision.
  app.delete("/api/entity-layouts/invalid/:kind", {
    schema: {
      tags: ["entity-layouts"],
      params: invalidKindParams,
    },
  }, async (req, reply) => {
    const {
      kind,
    } = req.params as { kind: string };
    await deleteEntityLayout(kind);
    reply.status(204);
  });
}
