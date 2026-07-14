---
name: api-errors
description: >-
  Return and translate API errors in eeSimple Bookmarks — the `AppError` envelope contract every
  Fastify route/service uses (a stable `code` + HTTP `statusCode` + English `message` + optional
  `params`, serialized by one `setErrorHandler`, re-mapped to translated phrases client-side). Use
  when asked to "return an API error", "throw AppError vs reply.code", "add a new error code", "add
  an ErrorCode / AppError subclass", "what status code for a duplicate/built-in/not-found", "why
  isn't my error translated", "the client shows raw English for X", "should this route hand-roll
  reply.code", or when a route needs to surface an external-fetch failure. Mirrors the
  Duplicate*Error (409) / BuiltIn*Error (403) / NotFound (404) subclasses and the youtube-channels
  image-auto discriminated-result route. Also covers maintaining the contract — "normalize a route
  that hand-rolls an error body", "add params to an error".
---

# API error envelope: throw `AppError`, one handler, one shape

Every user-facing failure is an **`AppError`**: a stable machine `code`, an HTTP `statusCode`, an
English `message` (the fallback shown when the client can't translate the code), and optional
interpolation `params`. Services/routes just **`throw`** — the single `setErrorHandler` in `app.ts`
(implemented in `packages/middleware/src/utils/errorHandler.ts`) serializes any thrown `AppError` to
the uniform envelope `{ message, code, statusCode, params? }`. The middleware stays **i18n-free**: it
emits codes + English text, never translated strings. The **client** maps `code` → a localized phrase;
an unmapped code falls back to the English `message`.

The invariant: **one throw, one handler, one envelope shape.** Routes don't build error bodies for
domain failures. The only sanctioned place a route emits its own error body is a *discriminated result
union* returned by a helper (below), and even then it must match the envelope shape.

## The pieces

- **`AppError` base + `errorBody` + the `ErrorCode` union** — `packages/middleware/src/utils/errors.ts`.
  `AppError(message, code, statusCode, params?)`; `errorBody(err)` produces `{ message, code,
  statusCode, ...(params) }`. The `ErrorCode` union (17 codes) is the single source of truth the
  client's map is checked against. This file also holds the **7 generic subclasses** reused everywhere:
  `NotFoundError` (404), `ValidationError` (400), `StorageUnconfiguredError` (503),
  `NoFileUploadedError` (400), `UnsupportedImageError` (400), `ImageTooLargeError` (413),
  `MaxImagesReachedError` (409).
- **~40 domain subclasses live per-service**, co-located at the top of each `services/*.ts` — each a
  thin `extends AppError` fixing a `code` + `statusCode` (+ `params`). E.g.
  `services/youtubeChannels.ts` → `DuplicateYouTubeChannelError` (`duplicateName`, 409),
  `services/websites.ts` → `DuplicateDomainError` (`duplicateDomain`, 409) / `BuiltInWebsiteError`
  (`builtInImmutable`, 403), `services/categories.ts` → `BuiltInCategoryError` (`builtInImmutable`,
  403). Define a new one **beside the service that throws it**, not in `utils/errors.ts`.
- **The central handler** — `packages/middleware/src/utils/errorHandler.ts`. Three branches: an
  `AppError` → `errorBody`; a Fastify schema-validation error → `{ code: "schemaValidation", 400 }`;
  anything else → `{ code: "internal" (5xx) | "error", statusCode }` (5xx logged). Registered via
  `app.setErrorHandler(errorHandler)` in `app.ts`.
- **Client translation** — a failed request throws an `ApiError` (parsed from the JSON body at the
  `request()` boundary in `packages/client/src/lib/api/client.ts`). `describeError(err, fallback)`
  (`packages/client/src/lib/apiError.ts`) resolves it: known `code` → `translateErrorCode` localized
  phrase (interpolated with `params`) → else the server's English `message` → else the fallback. The
  `code → i18n.t(...)` map is `ERROR_CODE_MESSAGES` in `packages/client/src/lib/errorMessages.ts`.
  Mutations toast via `notifyError(describeError(err, "…"))`.

## Status conventions

| Status | Meaning | Code / subclass |
|---|---|---|
| 400 | Domain/business-rule validation, invalid input, cycle attempt, reassign-target problem | `validation` (`ValidationError`, `*Cycle*`, `Invalid*ReassignError`) |
| 403 | Built-in vocabulary can't be renamed/deleted | `builtInImmutable` (`BuiltIn*Error`) |
| 404 | Looked-up entity doesn't exist | `notFound` (`NotFoundError`) |
| 409 | Uniqueness collision (duplicate name/domain/url/key), or a concurrency conflict | `duplicateName` / `duplicateDomain` / `duplicateUrl` / `duplicateChannelKey` / `conflict` (`Duplicate*Error`, `MaxImagesReachedError`) |
| 413 | Uploaded image too large | `imageTooLarge` (`ImageTooLargeError`) |
| 422 | A requested transform can't be applied | `conflict` (`TaxonomyConversionError`) |
| 503 | Object storage not configured | `storageUnconfigured` (`StorageUnconfiguredError`) |
| 502 | External provider unreachable / image grab failed (**discriminated-result route only**) | free-form reason code (see below) |

## The decision boundary — throw vs `reply.code()`

Ask **"where does the failure come from?"**

- **A domain / validation / uniqueness / permission / not-found failure → `throw` an `AppError`.**
  Never catch it in the route to rewrite the body — let it propagate to `errorHandler`. Reuse a generic
  subclass (`NotFoundError`, `ValidationError`, …), or a per-service `Duplicate*/BuiltIn*` subclass, or
  a **bare `AppError` with an existing code** when nothing reusable fits
  (`throw new AppError("A backfill job is already in progress", "conflict", 409)`).
- **A helper that models failure as *returned data* (a discriminated result union), not an exception
  → the route may `reply.code().send(...)`.** This is the sanctioned exception, for external-fetch / IO
  where a thrown error across the boundary would be awkward: the image-grab helpers
  (`fetchAndStoreChannelImage`, `fetchAndStoreOgImage`, favicon capture) and the metadata scan / ISBN
  lookups. **The body must still be the envelope shape** `{ message, code, statusCode, detail? }` — the
  same keys `errorHandler` produces. Never hand-roll `{ message, reason }` or a body missing
  `statusCode`.

If you're catching your own service's thrown `AppError` only to change its wording, you're on the
wrong side of the line — see the client-owns-phrasing note in "Add a new error" below.

## Recipe — add / surface an error

1. **Reuse an existing subclass** when the meaning fits (`throw new NotFoundError("Channel")`,
   `throw new ValidationError("…")`). Nothing else to do — the code already has a client entry (or
   deliberately falls back to English).
2. **New domain subclass** — define it at the top of the owning `services/*.ts`:
   ```ts
   /** 409 — a rename collides with an existing widget name. */
   export class DuplicateWidgetError extends AppError {
     constructor(name: string) {
       super(`A widget named "${name}" already exists`, "duplicateName", 409, { entity: "widget", name });
     }
   }
   ```
   Reuse an existing `code` (`duplicateName` here) when the semantics match — the client entry is
   already there. `throw` it from the service; the route stays a plain happy-path handler.
3. **New `ErrorCode`** (only when no existing code fits) — add the literal to the `ErrorCode` union in
   `packages/middleware/src/utils/errors.ts`, **and** — the one sync point not enforced by the compiler
   — add a matching `i18n.t(...)` entry to `ERROR_CODE_MESSAGES` in
   `packages/client/src/lib/errorMessages.ts` if the message should be localized/interpolated. The
   client map is `Record<string, …>`, **not** `Record<ErrorCode, …>`, so a missing entry does **not**
   fail `tsc` — it silently degrades to the server's English `message`. Add an assertion to
   `packages/client/src/lib/errorMessages.test.ts` for a code you localize. Codes whose server
   `message` is bespoke human text meant to surface verbatim (`validation`, `schemaValidation`,
   `internal`) intentionally have **no** client entry.

**Client owns the user-facing phrasing.** Because the client keys off `code`, don't reword a message in
a route (that strips the `code` and makes it untranslatable). Change the wording in the service
subclass constructor (English source) or the `errorMessages.ts` entry (localized) instead.

## Recipe — a route mapping a discriminated result (the sanctioned `reply.code`)

Reference: the avatar auto-capture route in `packages/middleware/src/routes/youtubeChannels.ts`
(`POST /api/youtube-channels/:id/image/auto`). `fetchAndStoreChannelImage(id)` returns a union
(`"not_found"` | `{ code, detail }` | `string` reason | the stored image), and the route maps it:

```ts
const result = await fetchAndStoreChannelImage(id);
if (result === "not_found") throw new NotFoundError("Channel");          // still throw for domain 404
// Sanctioned discriminated-result → reply.code mapping: emit the standard envelope shape.
if (typeof result === "object" && "code" in result) {
  return reply.code(502).send({
    message: IMAGE_GRAB_ERROR_MESSAGES[result.code] ?? "Could not fetch an avatar",
    code: result.code,
    statusCode: 502,
    detail: result.detail,
  });
}
```

The image-grab reason strings (`no_image` / `bad_image` / `blocked` / `server_error` / `fetch_error`)
are the **accepted carve-out to "`code` is an `ErrorCode`"**: they ride in `code` as free-form reasons,
require **no** `ErrorCode` union or `errorMessages.ts` entry, and the client falls back to the English
`message` (the human wording lives in the route's `IMAGE_GRAB_ERROR_MESSAGES` map). Keep the `not_found`
arm a real `throw` — only the *provider-failure* arm is discriminated-result.

## Known deviations (don't copy these)

These predate the codified rule; leave them unless the issue you're on asks to normalize one (wider
cleanup is optional follow-up):

- **Hand-rolled ad-hoc bodies** in `routes/metadata.ts` (`{ message, reason }` at :421;
  `{ message, detail }` with no `code`/`statusCode` at :518/:523) and the image auto-capture routes in
  `routes/people.ts` / `routes/groups.ts` / `routes/websites.ts` / `routes/bookmarkImageRoutes.ts`
  (`{ message, code }` with no `statusCode`). Bring these to the full envelope shape if you touch them.
- **`errorHandler`'s non-AppError fallback emits `code: "error"`**, which is *not* in the `ErrorCode`
  union — a documented wart, harmless (client falls back to `message`).
- **Image routes sometimes throw a raw `AppError(…, "unsupportedImage", 415)`** where the named
  `UnsupportedImageError` is 400 — the status differs by call site by design (upload = 415).

## Verify

```
pnpm build           # types → middleware → client
pnpm typecheck
pnpm test            # includes packages/client/src/lib/errorMessages.test.ts
pnpm lint:fix        # always from repo root
```

Behavioral: a duplicate returns `409` with `{ message, code: "duplicateName", statusCode: 409, params }`
and the client toast renders the localized phrase; an external-fetch failure returns `502` with
`{ message, code, statusCode: 502, detail? }` and (for an uncoded reason) the English `message`.
