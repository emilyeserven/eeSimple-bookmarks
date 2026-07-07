/**
 * Shared Fastify JSON-Schema param fragments for bookmark routes — used by both
 * `bookmarks.ts` and `bookmarkImageRoutes.ts` (like `labeledWebsitesSchema.ts` /
 * `conditionSchema.ts`, defined once here rather than duplicated per file).
 */

export const bookmarkParams = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
  },
} as const;

export const bookmarkImageParams = {
  type: "object",
  required: ["id", "imageId"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    imageId: {
      type: "string",
      format: "uuid",
    },
  },
} as const;
