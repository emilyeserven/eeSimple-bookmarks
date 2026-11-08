/**
 * Shared error envelope for the API.
 *
 * Every user-facing failure is an {@link AppError}: it carries a stable machine `code`, the HTTP
 * `statusCode`, an English `message` (the fallback shown when the client can't translate the code),
 * and optional interpolation `params`. The central `setErrorHandler` in `app.ts` serializes any
 * thrown `AppError` to `{ message, code, statusCode, params? }` — routes just `throw`, they don't
 * build error bodies. The client maps `code` → a translated phrase (see `lib/errorMessages.ts`);
 * unmapped codes fall back to the English `message`.
 *
 * The middleware stays i18n-free: it emits codes + English, never translated text.
 */

/** Interpolation values echoed back to the client so it can render a localized message. */
export type ErrorParams = Record<string, string | number>;

/**
 * Stable error codes. This union is the single source of truth the client's code→phrase map is
 * checked against — add a code here and give it a client mapping (or let it fall back to English).
 */
export type ErrorCode
  = | "notFound"
    | "duplicateName"
    | "builtInImmutable"
    | "validation"
    | "conflict"
    | "storageUnconfigured"
    | "noFileUploaded"
    | "schemaValidation"
    // `errorHandler`'s non-AppError fallback for a non-5xx / 5xx thrown error.
    | "error"
    | "internal";

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: ErrorCode,
    readonly statusCode: number,
    readonly params?: ErrorParams,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** The JSON body sent for an {@link AppError} — the uniform error envelope. */
export function errorBody(err: AppError) {
  return {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    ...(err.params && {
      params: err.params,
    }),
  };
}

// ── Semantic subclasses used directly by routes/services ────────────────────────────────────────

/** 404 — a looked-up entity doesn't exist. `entity` is an English label (e.g. "Item"). */
export class NotFoundError extends AppError {
  constructor(entity: string, message = `${entity} not found`) {
    super(message, "notFound", 404, {
      entity,
    });
  }
}

/** 409 — a name/slug-unique entity already has a row with this name. */
export class DuplicateNameError extends AppError {
  constructor(entity: string, name: string) {
    super(`A ${entity} named "${name}" already exists`, "duplicateName", 409, {
      entity,
      name,
    });
  }
}

/** 400 — a request failed a domain/business-rule validation. */
export class ValidationError extends AppError {
  constructor(message: string, params?: ErrorParams) {
    super(message, "validation", 400, params);
  }
}

/** 503 — object storage isn't configured, so file upload/serving is unavailable. */
export class StorageUnconfiguredError extends AppError {
  constructor(message = "File storage is not configured") {
    super(message, "storageUnconfigured", 503);
  }
}

/** 400 — a multipart upload arrived with no file part. */
export class NoFileUploadedError extends AppError {
  constructor(message = "No file uploaded") {
    super(message, "noFileUploaded", 400);
  }
}
