/**
 * Shared Fastify JSON-Schema fragment for the `labeledWebsites` field (issue #1059) — a list of
 * `{ label, url, websiteId }` rows carried by every URL-bearing entity's update body. Defined once
 * here (like `conditionSchema.ts`) and spread into each entity route's update body so the shape
 * stays in one place rather than copy-pasted per route (the mistake `socialLinksSchema` made).
 */

export const labeledWebsitesSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["label", "url", "websiteId"],
    additionalProperties: false,
    properties: {
      label: {
        type: "string",
      },
      url: {
        type: "string",
      },
      websiteId: {
        type: ["string", "null"],
        format: "uuid",
      },
    },
  },
} as const;
