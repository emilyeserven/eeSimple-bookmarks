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
}
