---
name: add-endpoint
description: >-
  Add a Fastify route/endpoint to the eeSimple Bookmarks middleware — the module-level JSON-schema
  const pattern, `registerBulkDelete`, status-code conventions, and the general Fastify AJV
  `removeAdditional` trap where an `additionalProperties: false` body silently drops any field not
  declared in its schema. Use when asked to "add a route/endpoint", "add a REST API for X", "why does
  my new field never reach the service / always come back null", "add a bulk action route", "add a
  multipart upload route", "add a query-string route", or when the `add-entity` skill's routes step
  ("copy routes/mediaTypes.ts") needs unpacking. Mirrors `routes/categories.ts` / `routes/mediaTypes.ts`
  (base CRUD) and `routes/websites.ts` (bulk-patch, query-string, multipart, streaming, discriminated
  result variations). Cross-links the `api-errors` skill for the throw-vs-`reply.code` decision — this
  skill does not re-document that contract. Also covers maintaining an endpoint — "add a field to an
  existing route body", "a PATCH silently drops my new column".
---

# Add a Fastify route/endpoint

Every entity's route file (`packages/middleware/src/routes/<entity>.ts`) follows the same shape.
Build a new one by copying an existing, complete file rather than from scratch — **`routes/categories.ts`**
and **`routes/mediaTypes.ts`** are the leanest complete references; **`routes/websites.ts`** shows the
variations beyond basic CRUD (bulk-patch, query-string, multipart upload, streaming, discriminated
result mapping).

## The base CRUD recipe

Reference: `routes/categories.ts`.

1. **Module-level `as const` JSON-schema consts**, declared above the route function:
   - `<entity>Params` — `{ type: "object", required: ["id"], properties: { id: { type: "string",
     format: "uuid" } } }`. Reused by GET-by-id/PATCH/DELETE.
   - `create<Entity>Body` — `type: "object"`, `required: [...]`, **`additionalProperties: false`**,
     `properties: {...}`.
   - `update<Entity>Body` — `type: "object"`, `additionalProperties: false`, `properties: {
     ...create<Entity>Body.properties, /* update-only fields, e.g. isFavorite */ }`. **Spread the
     create body's `properties`** (the `categories.ts` form) rather than re-listing every field by hand
     (as `mediaTypes.ts` does) — the spread is the one edit point when a shared field changes; a
     duplicated list is a second place to remember.
2. **`export async function <entity>Routes(app: FastifyInstance): Promise<void> { ... }`.**
3. **`registerBulkDelete(app, "/api/<path>", "<tag>", bulkDelete<Entities>)` is called first**, before
   the other routes. Signature (`routes/bulkDeleteRoute.ts`):
   ```ts
   export function registerBulkDelete(
     app: FastifyInstance,
     basePath: string,
     tag: string,
     bulkDelete: (ids: string[]) => Promise<BulkDeleteResult[]>,
   ): void
   ```
   It registers `POST <basePath>/bulk-delete` with body `{ ids: uuid[], minItems: 1 }`,
   `additionalProperties: false`, and returns the service's `BulkDeleteResult[]` — don't hand-roll a
   bulk-delete route per entity.
4. **Every route's `schema` carries `tags: ["<entity-plural-kebab>"]`** — drives the Swagger/OpenAPI
   grouping at `/docs`.
5. **Status codes**:
   - Create → `const x = await createX(req.body as CreateXInput); return reply.code(201).send(x);`
   - Update → destructure `id` from `req.params as { id: string }`, `const x = await updateX(id,
     req.body as UpdateXInput); if (!x) throw new NotFoundError("Category"); return x;` (plain
     return = 200, no explicit `.code()`).
   - Delete → `const deleted = await deleteX(id); if (!deleted) throw new NotFoundError("Category");
     return reply.code(204).send();`
   - `NotFoundError`'s first arg is the **singular English entity label** shown in the error message —
     see the `api-errors` skill for the rest of the error-envelope contract (which subclass, which
     status code, when a route may map a discriminated result instead of throwing).
6. **Casting**: `req.body as CreateXInput` / `req.params as { id: string }` / `req.query as {...}`.
   Fastify's AJV already validated the shape against the route's `schema`, so the cast is to the shared
   `@eesimple/types` input type for downstream type-safety, not a runtime safety check.
7. **Wire the route module into `app.ts`** — easy to miss because nothing fails loudly if you don't:
   add `import { xRoutes } from "@/routes/x";` near the top of `packages/middleware/src/app.ts`, and
   `await app.register(xRoutes);` inside the boot function alongside the others. A route file that
   exists but isn't registered here 404s with no error anywhere in the route file itself.

## Beyond basic CRUD (`routes/websites.ts` variations)

- **Custom bulk-mutation routes**, beyond the generic `registerBulkDelete`: `POST /api/websites/bulk`
  (body `{ ids, patch: updateWebsiteBody }`, calls a `bulkUpdateX(ids, patch)` service fn) and
  `POST /api/websites/bulk-tags` (`{ ids, tagIds, op: "add"|"remove" }`) — the pattern for a bulk op
  that isn't delete.
- **Query-string routes**: `schema: { querystring: <schema> }` (same shape as `body`), destructure via
  `req.query as {...}`. Reference: `GET /api/websites/lookup`.
- **Multipart file upload**: `schema: { consumes: ["multipart/form-data"] }`, **no `body` schema**
  (multipart isn't AJV-validated the same way). Manually `await req.file()`, `.toBuffer()`; catch
  `(err as { code?: string }).code === "FST_REQ_FILE_TOO_LARGE"` → `throw new ImageTooLargeError()`.
- **Streaming a binary response**: set `reply.header("Content-Type", ...)` /
  `reply.header("Cache-Control", "public, max-age=31536000, immutable")`, then `return
  reply.send(object.body)` (a stream) instead of returning JSON.
- **Delete-plus-cleanup ordering**: when a delete has an object-storage/side-effect cleanup that isn't
  covered by a DB cascade, read the dependent row **before** deleting the parent row (so you still have
  the storage key once the row is gone), then do the cleanup as a best-effort
  `.catch(() => undefined)` **after** confirming the row delete succeeded — the row delete is the
  operation that must not silently fail; the cleanup is advisory.
- **The sanctioned discriminated-result `reply.code()` mapping** (e.g. the favicon auto-capture route)
  is documented in full in the **`api-errors`** skill — don't re-derive it here; a route only hand-rolls
  a response body for a helper that returns a discriminated union, and even then the body must match the
  standard envelope shape.

## The general `removeAdditional` trap

**Any route body/querystring schema with `additionalProperties: false` has Fastify's AJV
`removeAdditional` option silently strip any property not declared in that schema's `properties`.** A
new column added to `schema.ts` that isn't also added to the route's JSON schema **never reaches the
service — no 400, no error anywhere, the field is just always absent/null**, as if it were never sent.
This is not a quirk of two specific bodies; it applies to **every** `additionalProperties: false` body
in the middleware, which is nearly all of them (see the base-recipe step above — every `create<Entity>Body`
/ `update<Entity>Body` sets it). Treat "does this body's schema list the new field" as a required step
whenever a field is added to an entity, not just when a bug report says a save silently no-ops.

Two concrete instances already caught this and are worth knowing as examples of the failure and the fix:

- **`routes/bookmarks.ts`'s bookmark `sections` schema and `updateBookmarkBody`.** The `sections[]`
  item schema is `additionalProperties: false`, so every optional `SectionEntry` field (entry **and**
  child level) must be listed there or a whole-set PATCH silently drops it. Guarded by a regression
  test, `tests/bookmarkSectionsSchema.test.ts`, which spins up a bare Fastify app with an `/echo` route
  using the exported schema and asserts specific optional fields round-trip.
- **`routes/cardFieldZonesSchema.ts`'s `PLACEMENT_PROP_SCHEMAS`.** Instead of a hand-maintained list
  that can drift silently, it's declared `as const satisfies Record<keyof CardFieldPlacement,
  unknown>` — so a new prop added to the shared `CardFieldPlacement` type in `@eesimple/types` **fails
  `tsc`** here until a matching schema entry is added, catching the drift at compile time instead of at
  runtime.

**Two defensive patterns to reach for on a new hand-maintained body schema**, in order of preference:

1. **A `satisfies Record<K, unknown>` map keyed by the shared type**, when a shared `@eesimple/types`
   type already enumerates the fields (the `cardFieldZonesSchema.ts` pattern) — a missing schema entry
   fails `tsc`, so it can't ship. Prefer this whenever such a type exists.
2. **A round-trip echo test**, when the schema is genuinely hand-maintained with no single shared type
   to check against (the `bookmarkSectionsSchema.test.ts` pattern) — assert that a payload carrying
   every optional field comes back unchanged through the schema.

**Related-but-distinct gotcha**: a `oneOf` of `additionalProperties: false` branches (rather than a
single merged schema) is dangerous for a different reason — AJV evaluates *every* branch to confirm
exactly one matches, so a payload that matches the wrong branch first gets its real properties stripped
by that branch's `removeAdditional` *before* validation fails, potentially corrupting or rejecting an
otherwise-valid payload. `routes/websites.ts`'s extension-fill schemas (`fillFilterSchema`,
`fillTargetSchema`, …) avoid this by using one merged object with `allOf`/`if`/`then` per discriminant
instead of `oneOf` — see the comment above `fillFilterSchema` in that file for the full rationale.

## New field end-to-end checklist

Adding a column to an existing entity touches five places, in this order — skipping the third is
exactly the silent-drop failure mode above:

1. **`packages/middleware/src/db/schema.ts`** — add the column (see the `db-schema-change` skill for
   whether it's a plain edit or needs a `migrate.ts` step).
2. **The route's body schema(s)** — add the property to **every** `additionalProperties: false` body
   that should carry it (typically both `create<Entity>Body` and, if it spreads from create,
   `update<Entity>Body` gets it automatically; if the body doesn't spread, add it to both explicitly).
3. **The service** (`packages/middleware/src/services/<entity>.ts`) — accept the field on create/update,
   include it in what's returned.
4. **Shared types** (`packages/types/src/index.ts` or the entity's types module) — add the field to the
   row type and `Create*Input`/`Update*Input`.
5. **Client** — the form/hook/display that reads or writes the field.

## Verify

```
pnpm typecheck
pnpm test            # includes any *Schema.test.ts round-trip guards
pnpm lint:fix         # always from repo root
```

Behavioral: PATCH a whole-set/complex body with every optional field populated and confirm every field
comes back on the following GET — this is what a missing schema property fails silently, so a
typecheck-only pass won't catch it.
