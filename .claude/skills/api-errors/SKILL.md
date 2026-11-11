---
name: api-errors
description: >-
  Return and surface API errors in this app — the `AppError` envelope contract every Fastify
  route/service uses (a stable `code` + HTTP `statusCode` + human-readable `message` + optional
  `params`, serialized by one `setErrorHandler`, shown verbatim client-side). Use when asked to
  "return an API error", "throw AppError vs reply.code", "add a new error code", "add an ErrorCode /
  AppError subclass", "what status code for a duplicate/built-in/not-found", "the toast shows the
  wrong text for X", "should this route hand-roll reply.code", or when
  a route needs to surface an external-fetch failure. Mirrors the `NotFoundError` (404) /
  `DuplicateNameError` (409) / `ValidationError` (400) / `StorageUnconfiguredError` (503) subclasses in
  `utils/errors.ts`. Also covers maintaining the contract — "normalize a route that hand-rolls an error
  body", "add params to an error".
---

# API error envelope: throw `AppError`, one handler, one shape

Every user-facing failure is an **`AppError`**: a stable machine `code`, an HTTP `statusCode`, an
human-readable `message` (shown to the user as-is), and optional structured `params`. Services/routes just **`throw`** — the single `app.setErrorHandler(errorHandler)`
in `packages/middleware/src/app.ts` serializes it to the uniform envelope
`{ message, code, statusCode, params? }`. The **server owns the wording**: the client displays
`message` verbatim and only branches on `code` when it must react to a specific failure.

The invariant: **one throw, one handler, one envelope shape.** Routes don't build error bodies for
domain failures. The only sanctioned place a route emits its own error body is a *discriminated result
union* returned by a helper (below), and even then it must use the envelope shape.

## The pieces

- **`packages/middleware/src/utils/errors.ts`** — the `AppError(message, code, statusCode, params?)`
  base, `errorBody(err)` (builds the envelope), the **`ErrorCode` union** (the single list of codes,
  middleware-local), and the generic subclasses:
  `NotFoundError(entity)` (404, `notFound`, params `{ entity }`),
  `DuplicateNameError(entity, name)` (409, `duplicateName`, params `{ entity, name }`),
  `ValidationError(message, params?)` (400, `validation`),
  `StorageUnconfiguredError` (503, `storageUnconfigured`),
  `NoFileUploadedError` (400, `noFileUploaded`).
- **`packages/middleware/src/utils/errorHandler.ts`** — three branches: an `AppError` → `errorBody`;
  a Fastify schema-validation error → `{ code: "schemaValidation", statusCode: 400 }`; anything else →
  `{ code: "internal" }` for 5xx (logged) or `{ code: "error" }` otherwise. Tested by
  `packages/middleware/src/tests/errorHandler.test.ts`.
- **`packages/types/src/errors.ts`** — `ApiErrorBody`, the shared wire shape of the envelope.
- **Client** — `request()` in `packages/client/src/lib/api/client.ts` parses a failed response's JSON
  into an `ApiError` (`packages/client/src/lib/apiError.ts`) carrying `code`/`params`.
  `describeError(err, fallback?)` resolves display text: the server's `message` → else a plain
  Error's message → else the fallback. Mutations toast with
  `notifyError(describeError(err))` (see `hooks/useItems.ts`).

## Status conventions

| Status | Meaning | Code / subclass |
|---|---|---|
| 400 | Domain/business-rule validation, invalid input | `validation` (`ValidationError`) |
| 400 | Request failed the route's JSON schema (automatic) | `schemaValidation` (from `errorHandler`) |
| 400 | Multipart upload with no file part | `noFileUploaded` (`NoFileUploadedError`) |
| 403 | A built-in/seeded record can't be renamed or deleted | `builtInImmutable` (no subclass yet — see below) |
| 404 | Looked-up entity doesn't exist | `notFound` (`NotFoundError`) |
| 409 | Uniqueness collision (name/slug) | `duplicateName` (`DuplicateNameError`) |
| 409 | Concurrency / state conflict | `conflict` (bare `AppError`) |
| 503 | Optional dependency (object storage) not configured | `storageUnconfigured` (`StorageUnconfiguredError`) |
| 502 | External provider unreachable (**discriminated-result route only**) | see below |

## The decision boundary — throw vs `reply.code()`

Ask **"where does the failure come from?"**

- **A domain / validation / uniqueness / permission / not-found failure → `throw` an `AppError`.**
  Never catch it in the route to rewrite the body — let it propagate. Reuse a generic subclass; or
  define a small subclass; or throw a **bare `AppError` with an existing code** when nothing reusable
  fits (`throw new AppError("An import is already running", "conflict", 409)`).
- **A helper that models failure as *returned data* (a discriminated result union), not an exception
  → the route may `reply.code().send(...)`.** This is the sanctioned exception, for external-fetch / IO
  helpers where an exception across the boundary would be awkward. **The body must still be the
  envelope shape** `{ message, code, statusCode, detail? }` — the same keys `errorHandler` produces.
  Never hand-roll `{ message, reason }` or a body missing `statusCode`. Keep a plain domain failure in
  the same route (e.g. the parent row doesn't exist) a real `throw`:

  ```ts
  const result = await fetchRemoteThing(id);           // returns "not_found" | { kind, detail } | Thing
  if (result === "not_found") throw new NotFoundError("Item");
  if ("kind" in result) {
    return reply.code(502).send({
      message: "Could not reach the provider",
      code: result.kind,          // add it to the ErrorCode union
      statusCode: 502,
      detail: result.detail,      // raw cause, surfaced as ApiError.detail for console logging
    });
  }
  return result;
  ```

If you catch your own service's `AppError` only to change its wording, you're on the wrong side of the
line — see "Server owns the phrasing" below.

## Recipe — add / surface an error

1. **Reuse an existing subclass** when the meaning fits — `throw new NotFoundError("Widget")`,
   `throw new DuplicateNameError("widget", name)` (as `services/items.ts` does in `assertNameFree`).
   `entity` is a label interpolated into the message and echoed in `params`. Nothing else to do.
2. **New subclass** — when the same failure is thrown from several places. Generic, reusable ones go
   in `utils/errors.ts`; a domain-specific one can sit at the top of the service that throws it:
   ```ts
   /** 403 — built-in widgets can't be renamed or deleted. */
   export class BuiltInWidgetError extends AppError {
     constructor() {
       super("Built-in widgets can't be modified or deleted", "builtInImmutable", 403);
     }
   }
   ```
   Reuse an existing `code` when the semantics match.
3. **New `ErrorCode`** (only when no existing code fits) — add the literal to the `ErrorCode` union in
   `packages/middleware/src/utils/errors.ts`. If the client needs to react to it (e.g. show an inline
   field error instead of a toast), branch on `err instanceof ApiError && err.code === "…"`; the union
   isn't shared with the client, so keep the string in sync by hand.

**Server owns the phrasing.** The client shows `message` as-is, so write it for a human in the
subclass constructor (or the bare `AppError` call). Don't catch an `AppError` in a route just to
reword it — change the source message instead, and keep the `code` intact.

## Known gaps / deviations

- `builtInImmutable` and `conflict` are in the `ErrorCode` union but have **no named subclass** yet —
  add one (step 2) the first time you need it.

## Verify

```
pnpm typecheck
pnpm test                # includes tests/errorHandler.test.ts and lib/apiError.test.ts
pnpm lint:fix            # always from the repo root
```

Behavioral: a duplicate returns `409` with `{ message, code: "duplicateName", statusCode: 409, params }`
and the client toast shows that `message`.
