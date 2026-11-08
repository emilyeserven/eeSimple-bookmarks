/**
 * Example domain module — the shared shapes for the starter `items` entity.
 *
 * Request/response types declared here MUST be consumed by the middleware route that implements
 * them (type the parsed body with it beside the JSON schema) and by the client API module. New types
 * go in a domain module like this one, not appended to `index.ts` — `index.ts` only re-exports.
 */

/** An item as returned by the API (dates serialized as ISO strings). */
export interface Item {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/items` body. */
export interface CreateItemInput {
  name: string;
  description?: string | null;
}

/** `PATCH /api/items/:id` body — every field optional. */
export type UpdateItemInput = Partial<CreateItemInput>;
