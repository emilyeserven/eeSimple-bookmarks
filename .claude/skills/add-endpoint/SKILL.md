---
name: add-endpoint
description: >-
  Add a Fastify route/endpoint to the `@app/middleware` API — the module-level JSON-schema const
  pattern, status-code conventions, registering the module (and its Swagger tag) in `app.ts`, and the
  general Fastify AJV `removeAdditional` trap where an `additionalProperties: false` body silently
  drops any field not declared in its schema. Use when asked to "add a route/endpoint", "add a REST
  API for X", "why does my new field never reach the service / always come back null", "add a bulk
  action route", "add a multipart upload route", "add a query-string route", or when the `add-entity`
  skill's routes step needs unpacking. Mirrors `routes/items.ts` (base CRUD) and `routes/files.ts`
  (multipart upload, streaming a binary response). Cross-links the `api-errors` skill for the
  throw-vs-`reply.code` decision — this skill does not re-document that contract. Also covers
  maintaining an endpoint — "add a field to an existing route body", "a PATCH silently drops my new
  column".
---

# Add a Fastify route/endpoint

Every route module (`packages/middleware/src/routes/<entity>.ts`) follows the same shape. Build a new
one by copying a complete file rather than from scratch — **`routes/items.ts`** is the base CRUD
reference; **`routes/files.ts`** shows multipart upload and streaming a binary response.

## The base CRUD recipe

Reference: `routes/items.ts`.

1. **Module-level `as const` JSON-schema consts**, declared above the route function:
   - `<entity>Schema` — the response shape (used in `response: { 200: … }`). A response schema also
     acts as a serializer: properties it doesn't list are **dropped from the response**, so keep it in
     sync with the shared type too.
   - `idParams` — `{ type: "object", required: ["id"], properties: { id: { type: "string", format:
     "uuid" } } }`. Reused by GET-by-id / PATCH / DELETE. A malformed id becomes a 400
     `schemaValidation` instead of a database error.
   - One shared `<entity>BodyProperties` object, spread into both bodies:
     - `createBody` — `type: "object"`, `required: [...]`, **`additionalProperties: false`**,
       `properties: <entity>BodyProperties`.
     - `updateBody` — same, minus `required`. Add update-only fields by spreading:
       `properties: { ...<entity>BodyProperties, /* update-only */ }`.
     The shared properties object is the **one edit point** when a field changes; two hand-copied
     lists are two places to forget.
2. **`export async function <entity>Routes(app: FastifyInstance): Promise<void> { … }`**, with
   `const tags = ["<entity-plural-kebab>"];` at module level and `tags` on every route's `schema` —
   that groups the routes in the Swagger UI at `/docs`.
3. **Type the request with the shared `@app/types` input** via Fastify's generics, beside the schema:
   `app.post<{ Body: CreateItemInput }>(…)`, `app.patch<{ Params: { id: string }; Body:
   UpdateItemInput }>(…)`. AJV has already validated the shape, so this is for downstream
   type-safety. A request/response type declared in `@app/types` **must** be consumed by the route
   that implements it — don't declare aspirational payload types.
4. **Status codes:**
   - List / get / update → plain `return` (200).
   - Create → `reply.code(201).send(await createX(req.body))`.
   - Delete → `await deleteX(id); return reply.code(204).send();`
   - Failures are **thrown by the service** (`NotFoundError`, `DuplicateNameError`, …), not built by
     the route — `services/items.ts` throws `NotFoundError("Item")` from `getItem`/`deleteItem`. See
     the **`api-errors`** skill for which subclass/status and the one sanctioned `reply.code()`
     exception.
5. **Register the module in `packages/middleware/src/app.ts`** — easy to miss because nothing fails
   loudly: add `import { widgetRoutes } from "@/routes/widgets";` and `await app.register(widgetRoutes);`
   next to `itemRoutes`. A route file that isn't registered just 404s. While there, add a
   `{ name, description }` entry to the swagger `openapi.tags` array so the tag has a description.
6. All API paths start with `/api/` — the gateway proxies only `/api/*` to the middleware.

## Variations

- **Query-string routes:** `schema: { querystring: <schema> }` (same shape as a body schema), typed
  via `app.get<{ Querystring: {...} }>`. The `removeAdditional` trap below applies here too.
- **Multipart file upload** (`POST /api/files` in `routes/files.ts`): `schema: { consumes:
  ["multipart/form-data"] }` and **no `body` schema** (multipart isn't AJV-validated). `await
  req.file()`, throw `NoFileUploadedError` if absent, then `.toBuffer()`. The upload size cap is set
  once on the `@fastify/multipart` registration in `app.ts` (`UPLOAD_MAX_BYTES`, `throwFileSizeLimit:
  true`).
- **Streaming a binary response** (`GET /api/files/:key`): set `reply.type(...)` / headers, then
  `return reply.send(stream)` instead of returning JSON.
- **Feature-gated routes:** check the precondition first and throw (`requireStorage()` in
  `routes/files.ts` throws `StorageUnconfiguredError`, 503) so the rest of the API works when an
  optional dependency isn't configured.
- **Bulk routes:** a `POST /api/<entity>/bulk-<op>` with body `{ ids: { type: "array", items: { type:
  "string", format: "uuid" }, minItems: 1 } }` and `additionalProperties: false`. If more than one
  entity needs bulk delete, extract a shared `registerBulkDelete(app, basePath, tag, fn)` helper
  rather than hand-rolling it per module.
- **Delete-plus-cleanup ordering:** when a delete also has an object-storage side effect not covered
  by a DB cascade, read the storage key **before** deleting the row (the row holds the key), then do
  the cleanup best-effort (`.catch(() => undefined)`) **after** the row delete succeeds — the row
  delete must not silently fail; the cleanup is advisory.

## The general `removeAdditional` trap

**Any body/querystring schema with `additionalProperties: false` has Fastify's AJV `removeAdditional`
option silently strip every property not declared in that schema's `properties`.** A new column added
to `schema.ts` and to the shared type but **not** to the route's JSON schema never reaches the service —
**no 400, no error anywhere; the field is just always absent/null**, as if it was never sent. This
applies to every `additionalProperties: false` body (the `createBody`/`updateBody` pattern above sets it
on purpose). Treat "does the body schema list the new field?" as a required step whenever a field is
added — not something to discover from a "save silently does nothing" bug.

The mirror image happens on the way out: a field missing from the **response** schema is silently
dropped from the JSON the client receives.

**Defensive patterns for a hand-maintained schema**, in order of preference:

1. **A `satisfies Record<K, unknown>` map keyed by the shared type**, when an `@app/types` type
   enumerates the fields:
   ```ts
   const widgetBodyProperties = {
     name: { type: "string", minLength: 1 },
     description: { type: ["string", "null"] },
   } as const satisfies Record<keyof CreateWidgetInput, unknown>;
   ```
   A field added to the type but not the schema then **fails `tsc`**, so it can't ship.
2. **A round-trip echo test**, when no single type covers the schema (e.g. nested arrays of optional
   fields): build a bare Fastify app in a `node:test` file under `packages/middleware/src/tests/`,
   register an `/echo` route using the exported schema, and assert a payload carrying **every
   optional field** comes back unchanged. Export the schema const to make this possible.

**Related gotcha — `oneOf` of `additionalProperties: false` branches.** AJV evaluates every branch, and
a branch that doesn't match can still strip the payload's real properties via `removeAdditional`
*before* failing, corrupting or rejecting an otherwise-valid body. Prefer one merged object schema with
`allOf` / `if` / `then` per discriminant over `oneOf`.

## New field end-to-end checklist

Adding a column to an existing entity touches these places — skipping step 3 is exactly the silent-drop
failure above:

1. **`packages/middleware/src/db/schema.ts`** — the column (see the **`db-schema-change`** skill for
   whether it also needs a `migrate.ts` step).
2. **`packages/types/src/<entity>.ts`** — the row type and `Create*Input`/`Update*Input`.
3. **The route's schemas** — the shared body properties (so both bodies get it) **and** the response
   schema.
4. **The service** — accept it on create/update and include it in the `to<Entity>` mapper.
5. **Middleware test** (`src/tests/<entity>.test.ts`) and the client factory default in
   `packages/client/src/test-utils/factories.ts`.
6. **Client** — the form/hook/display that reads or writes it.

## Verify

```
pnpm typecheck
pnpm --filter=@app/middleware test
pnpm lint:fix            # always from the repo root
```

Behavioral: with `pnpm dev` running, PATCH a body with every optional field populated and confirm each
comes back on the next GET (or check `/docs`). A typecheck-only pass won't catch a missing schema
property.
