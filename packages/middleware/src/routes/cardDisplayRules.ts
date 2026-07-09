import type { FastifyInstance } from "fastify";
import type { CardDisplayConfig } from "@eesimple/types";
import {
  getCardDisplayConfig,
  updateCardDisplayConfig,
} from "@/services/cardDisplayRules";
import {
  cardDisplaySectionsSchema,
  cardImageCornersSchema,
} from "@/routes/cardFieldZonesSchema";

/**
 * The single Card Display config: the dynamic body `sections` (each with its own form/layout/
 * `visibleIf`), the four image corners, and the image presentation attributes. `PUT` is a partial
 * merge so each control on the settings page can auto-save its own field.
 */
const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    sections: cardDisplaySectionsSchema,
    imageCorners: cardImageCornersSchema,
    imageMode: {
      type: "string",
    },
    imageVisibility: {
      type: "string",
      enum: ["shown", "image-only", "off"],
    },
    imageLayout: {
      type: "string",
      enum: ["above", "side"],
    },
    hideWebsiteForYouTube: {
      type: "boolean",
    },
  },
} as const;

/** Read/update the single card-display configuration (the former Default rule). */
export async function cardDisplayRulesRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/card-display", {
    schema: {
      tags: ["card-display"],
    },
  }, async () => getCardDisplayConfig());

  app.put("/api/card-display", {
    schema: {
      tags: ["card-display"],
      body: updateBody,
    },
  }, async (req) => {
    const patch = req.body as Partial<CardDisplayConfig>;
    return updateCardDisplayConfig(patch);
  });
}
