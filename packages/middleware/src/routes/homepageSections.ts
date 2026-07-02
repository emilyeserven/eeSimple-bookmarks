import type { FastifyInstance } from "fastify";
import type {
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
} from "@eesimple/types";
import {
  createHomepageSection,
  deleteHomepageSection,
  listHomepageSectionBookmarks,
  listHomepageSections,
  reorderHomepageSections,
  updateHomepageSection,
} from "@/services/homepageSections";
import { cardZoneLayoutsSchema, fieldZonesSchema } from "@/routes/cardFieldZonesSchema";

/**
 * `sort`: a `BookmarkSort` (@eesimple/types) — either a primary/secondary field ordering or a
 * random shuffle, matching the Listings page Sort control. `null`/omitted = default order.
 */
const bookmarkSortDimensionSchema = {
  type: "object",
  required: ["field", "direction"],
  additionalProperties: false,
  properties: {
    field: {
      type: "string",
    },
    direction: {
      type: "string",
      enum: ["asc", "desc"],
    },
  },
} as const;

const bookmarkSortSchema = {
  oneOf: [
    {
      type: "null",
    },
    {
      type: "object",
      required: ["primary"],
      additionalProperties: false,
      properties: {
        primary: bookmarkSortDimensionSchema,
        secondary: bookmarkSortDimensionSchema,
      },
    },
    {
      type: "object",
      required: ["random", "seed"],
      additionalProperties: false,
      properties: {
        random: {
          type: "boolean",
          enum: [true],
        },
        seed: {
          type: "number",
        },
      },
    },
  ],
} as const;

const sectionParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

const createBody = {
  type: "object",
  required: ["title", "conditions"],
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    conditions: {
      $ref: "conditionTree#",
    },
    sortOrder: {
      type: "integer",
    },
    hideIfEmpty: {
      type: "boolean",
    },
    columns: {
      type: "integer",
    },
    imageMode: {
      type: "string",
    },
    imageLayout: {
      type: "string",
      enum: ["above", "side"],
    },
    imageVisibility: {
      type: "string",
      enum: ["shown", "image-only", "off"],
    },
    viewMode: {
      type: "string",
      enum: ["cards", "table"],
    },
    fieldZones: fieldZonesSchema,
    cardZoneLayouts: cardZoneLayoutsSchema,
    hiddenCardFields: {
      type: "array",
      items: {
        type: "string",
      },
    },
    cornerOverlays: {
      type: "boolean",
    },
    hideWebsiteForYouTube: {
      type: "boolean",
    },
    sort: bookmarkSortSchema,
    bookmarkLimit: {
      type: "integer",
      nullable: true,
      minimum: 1,
    },
  },
} as const;

const updateBody = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
      nullable: true,
    },
    conditions: {
      $ref: "conditionTree#",
    },
    sortOrder: {
      type: "integer",
    },
    hideIfEmpty: {
      type: "boolean",
    },
    columns: {
      type: "integer",
    },
    imageMode: {
      type: "string",
    },
    imageLayout: {
      type: "string",
      enum: ["above", "side"],
    },
    imageVisibility: {
      type: "string",
      enum: ["shown", "image-only", "off"],
    },
    viewMode: {
      type: "string",
      enum: ["cards", "table"],
    },
    fieldZones: fieldZonesSchema,
    cardZoneLayouts: cardZoneLayoutsSchema,
    hiddenCardFields: {
      type: "array",
      items: {
        type: "string",
      },
    },
    cornerOverlays: {
      type: "boolean",
    },
    hideWebsiteForYouTube: {
      type: "boolean",
    },
    sort: bookmarkSortSchema,
    bookmarkLimit: {
      type: "integer",
      nullable: true,
      minimum: 1,
    },
  },
} as const;

const reorderBody = {
  type: "object",
  required: ["orderedIds"],
  additionalProperties: false,
  properties: {
    orderedIds: {
      type: "array",
      items: {
        type: "string",
        format: "uuid",
      },
    },
  },
} as const;

/** CRUD + reorder for homepage sections, and the sections-with-bookmarks endpoint. */
export async function homepageSectionsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/homepage-sections", {
    schema: {
      tags: ["homepage-sections"],
    },
  }, async () => listHomepageSections());

  // Static sub-paths must be declared before /:id to avoid Fastify treating them as UUID params.
  app.put("/api/homepage-sections/reorder", {
    schema: {
      tags: ["homepage-sections"],
      body: reorderBody,
    },
  }, async (req, reply) => {
    const {
      orderedIds,
    } = req.body as { orderedIds: string[] };
    await reorderHomepageSections(orderedIds);
    reply.status(204);
  });

  app.get("/api/bookmarks/homepage-sections", {
    schema: {
      tags: ["homepage-sections"],
    },
  }, async () => listHomepageSectionBookmarks());

  app.post("/api/homepage-sections", {
    schema: {
      tags: ["homepage-sections"],
      body: createBody,
    },
  }, async (req, reply) => {
    const input = req.body as CreateHomepageSectionInput;
    const section = await createHomepageSection(input);
    reply.status(201);
    return section;
  });

  app.patch("/api/homepage-sections/:id", {
    schema: {
      tags: ["homepage-sections"],
      params: sectionParams,
      body: updateBody,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    const input = req.body as UpdateHomepageSectionInput;
    const section = await updateHomepageSection(id, input);
    if (!section) {
      reply.status(404);
      return {
        error: "Not Found",
        message: "Section not found",
        statusCode: 404,
      };
    }
    return section;
  });

  app.delete("/api/homepage-sections/:id", {
    schema: {
      tags: ["homepage-sections"],
      params: sectionParams,
    },
  }, async (req, reply) => {
    const {
      id,
    } = req.params as { id: string };
    await deleteHomepageSection(id);
    reply.status(204);
  });
}
